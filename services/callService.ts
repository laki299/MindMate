import { supabase } from "../lib/supabase";
import { getIceServers } from "./iceServers";

export type CallSignal =
  | { type: "offer"; sdp: string; from: string }
  | { type: "answer"; sdp: string; from: string }
  | { type: "ice"; candidate: any; from: string }
  | { type: "hangup"; from: string }
  | { type: "reject"; from: string }
  | { type: "mode"; mode: "audio" | "video"; from: string };

type CallCallbacks = {
  onRemoteStream?: (stream: any) => void;
  onLocalStream?: (stream: any) => void;
  onEnded?: (reason?: string) => void;
  onError?: (err: Error) => void;
  onConnectionState?: (state: string) => void;
  onModeChange?: (mode: "audio" | "video") => void;
};

/**
 * P2P audio/video. Needs react-native-webrtc (EAS build, not Expo Go).
 */
export class CallService {
  private pc: any = null;
  private localStream: any = null;
  private channel: any = null;
  private sessionKey: string;
  private myId: string;
  private isCaller: boolean;
  private callbacks: CallCallbacks;
  private closed = false;
  private videoEnabled: boolean;
  private webrtc: any = null;

  constructor(
    sessionKey: string,
    myId: string,
    isCaller: boolean,
    opts: { video?: boolean; callbacks?: CallCallbacks } = {}
  ) {
    this.sessionKey = sessionKey;
    this.myId = myId;
    this.isCaller = isCaller;
    this.videoEnabled = !!opts.video;
    this.callbacks = opts.callbacks || {};
  }

  private roomName() {
    return `call:${this.sessionKey}`;
  }

  async start() {
    try {
      this.webrtc = await import("react-native-webrtc");
      const {
        RTCPeerConnection,
        mediaDevices,
        RTCSessionDescription,
        RTCIceCandidate,
      } = this.webrtc;

      this.localStream = await mediaDevices.getUserMedia({
        audio: true,
        video: this.videoEnabled,
      });
      this.callbacks.onLocalStream?.(this.localStream);

      this.pc = new RTCPeerConnection({ iceServers: getIceServers() });

      this.localStream.getTracks().forEach((track: any) => {
        this.pc.addTrack(track, this.localStream);
      });

      this.pc.ontrack = (event: any) => {
        const stream = event.streams?.[0];
        if (stream) this.callbacks.onRemoteStream?.(stream);
      };

      this.pc.onicecandidate = (event: any) => {
        if (event.candidate) {
          this.send({
            type: "ice",
            candidate: event.candidate.toJSON
              ? event.candidate.toJSON()
              : event.candidate,
            from: this.myId,
          });
        }
      };

      this.pc.onconnectionstatechange = () => {
        const state = this.pc?.connectionState || "";
        this.callbacks.onConnectionState?.(state);
      };

      this.channel = supabase.channel(this.roomName(), {
        config: { broadcast: { self: false } },
      });

      this.channel
        .on("broadcast", { event: "signal" }, async ({ payload }: any) => {
          const msg = payload as CallSignal;
          if (!msg || msg.from === this.myId) return;

          try {
            if (msg.type === "offer" && !this.isCaller) {
              await this.pc.setRemoteDescription(
                new RTCSessionDescription({ type: "offer", sdp: msg.sdp })
              );
              const answer = await this.pc.createAnswer();
              await this.pc.setLocalDescription(answer);
              this.send({
                type: "answer",
                sdp: answer.sdp,
                from: this.myId,
              });
            }

            if (msg.type === "answer" && this.isCaller) {
              await this.pc.setRemoteDescription(
                new RTCSessionDescription({ type: "answer", sdp: msg.sdp })
              );
            }

            if (msg.type === "ice" && msg.candidate) {
              await this.pc.addIceCandidate(
                new RTCIceCandidate(msg.candidate)
              );
            }

            if (msg.type === "mode") {
              this.callbacks.onModeChange?.(msg.mode);
              if (msg.mode === "audio") {
                await this.setVideoEnabled(false, false);
              } else {
                await this.setVideoEnabled(true, false);
              }
            }

            if (msg.type === "hangup" || msg.type === "reject") {
              await this.end(msg.type);
            }
          } catch (e: any) {
            this.callbacks.onError?.(e);
          }
        })
        .subscribe(async (status: string) => {
          if (status === "SUBSCRIBED" && this.isCaller) {
            const offer = await this.pc.createOffer({
              offerToReceiveAudio: true,
              offerToReceiveVideo: true,
            });
            await this.pc.setLocalDescription(offer);
            this.send({
              type: "offer",
              sdp: offer.sdp,
              from: this.myId,
            });
          }
        });
    } catch (e: any) {
      this.callbacks.onError?.(
        new Error(
          e?.message?.includes("webrtc") || e?.message?.includes("Native")
            ? "WebRTC নেটিভ বিল্ড লাগবে (Expo Go নয়)"
            : e?.message || "Call failed"
        )
      );
      await this.end("error");
    }
  }

  mute(muted: boolean) {
    this.localStream?.getAudioTracks()?.forEach((t: any) => {
      t.enabled = !muted;
    });
  }

  /**
   * এক ক্লিক অডিও ↔ ভিডিও
   * notifyPeer=true হলে অন্য পাশে signal যাবে
   */
  async setVideoEnabled(enabled: boolean, notifyPeer = true) {
    if (!this.webrtc || !this.pc) return;
    const { mediaDevices } = this.webrtc;

    this.videoEnabled = enabled;

    if (enabled) {
      const vid = await mediaDevices.getUserMedia({ audio: false, video: true });
      const vTrack = vid.getVideoTracks()[0];
      const sender = this.pc
        .getSenders()
        .find((s: any) => s.track?.kind === "video");
      if (sender) {
        await sender.replaceTrack(vTrack);
      } else {
        this.pc.addTrack(vTrack, this.localStream || vid);
      }
      if (this.localStream) {
        this.localStream.addTrack(vTrack);
      }
    } else {
      this.pc.getSenders().forEach((s: any) => {
        if (s.track?.kind === "video") {
          s.track.enabled = false;
          s.track.stop?.();
        }
      });
    }

    if (notifyPeer) {
      this.send({
        type: "mode",
        mode: enabled ? "video" : "audio",
        from: this.myId,
      });
    }
  }

  private send(payload: CallSignal) {
    this.channel?.send({
      type: "broadcast",
      event: "signal",
      payload,
    });
  }

  async end(reason = "hangup") {
    if (this.closed) return;
    this.closed = true;

    try {
      this.send({ type: "hangup", from: this.myId });
    } catch {
      /* ignore */
    }

    try {
      this.localStream?.getTracks()?.forEach((t: any) => t.stop());
    } catch {
      /* ignore */
    }

    try {
      this.pc?.close();
    } catch {
      /* ignore */
    }

    try {
      if (this.channel) await supabase.removeChannel(this.channel);
    } catch {
      /* ignore */
    }

    this.pc = null;
    this.localStream = null;
    this.channel = null;
    this.callbacks.onEnded?.(reason);
  }
}

import { supabase } from "../lib/supabase";
import { getIceServers } from "./iceServers";

export type CallSignal =
  | { type: "offer"; sdp: string; from: string }
  | { type: "answer"; sdp: string; from: string }
  | { type: "ice"; candidate: any; from: string }
  | { type: "hangup"; from: string }
  | { type: "reject"; from: string };

type CallCallbacks = {
  onRemoteStream?: (stream: any) => void;
  onEnded?: (reason?: string) => void;
  onError?: (err: Error) => void;
  onConnectionState?: (state: string) => void;
};

/**
 * 1-on-1 audio WebRTC over Supabase Realtime broadcast.
 * Requires react-native-webrtc (dev client / EAS build).
 */
export class CallService {
  private pc: any = null;
  private localStream: any = null;
  private channel: any = null;
  private sessionId: string;
  private myId: string;
  private isCaller: boolean;
  private callbacks: CallCallbacks;
  private closed = false;

  constructor(
    sessionId: string,
    myId: string,
    isCaller: boolean,
    callbacks: CallCallbacks = {}
  ) {
    this.sessionId = sessionId;
    this.myId = myId;
    this.isCaller = isCaller;
    this.callbacks = callbacks;
  }

  private roomName() {
    return `call:${this.sessionId}`;
  }

  async start() {
    try {
      // Dynamic import — Expo Go তে ক্র্যাশ এড়াতে
      const webrtc = await import("react-native-webrtc");
      const {
        RTCPeerConnection,
        mediaDevices,
        RTCSessionDescription,
        RTCIceCandidate,
      } = webrtc as any;

      this.localStream = await mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

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
        if (state === "failed" || state === "disconnected") {
          // সংক্ষিপ্ত disconnect এ সাথে সাথে বন্ধ নাও করতে পারো
        }
        if (state === "closed") {
          this.callbacks.onEnded?.("closed");
        }
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
              offerToReceiveVideo: false,
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
        e?.message?.includes("webrtc")
          ? new Error(
              "WebRTC নেটিভ বিল্ড লাগবে (Expo Go নয়)। EAS Dev Client ব্যবহার করো।"
            )
          : e
      );
      await this.end("error");
    }
  }

  private send(payload: CallSignal) {
    this.channel?.send({
      type: "broadcast",
      event: "signal",
      payload,
    });
  }

  mute(muted: boolean) {
    this.localStream?.getAudioTracks()?.forEach((t: any) => {
      t.enabled = !muted;
    });
  }

  async end(reason = "hangup") {
    if (this.closed) return;
    this.closed = true;

    try {
      this.send({ type: "hangup", from: this.myId });
    } catch {
      // ignore
    }

    try {
      this.localStream?.getTracks()?.forEach((t: any) => t.stop());
    } catch {
      // ignore
    }

    try {
      this.pc?.close();
    } catch {
      // ignore
    }

    try {
      if (this.channel) {
        await supabase.removeChannel(this.channel);
      }
    } catch {
      // ignore
    }

    this.pc = null;
    this.localStream = null;
    this.channel = null;
    this.callbacks.onEnded?.(reason);
  }
      }

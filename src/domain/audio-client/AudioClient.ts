//
//  AudioClient.ts
//
//  Created by David Rowe on 15 Sep 2021.
//  Copyright 2021 Vircadia contributors.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

import AudioConstants from "../audio/AudioConstants";
import AudioInput from "../audio/AudioInput";
import InboundAudioStream from "../audio/InboundAudioStream";
import NLPacket from "../networking/NLPacket";
import Node from "../networking/Node";
import NodeList from "../networking/NodeList";
import NodeType from "../networking/NodeType";
import PacketReceiver from "../networking/PacketReceiver";
import ReceivedMessage from "../networking/ReceivedMessage";
import SockAddr from "../networking/SockAddr";
import PacketScribe from "../networking/packets/PacketScribe";
import PacketType, { PacketTypeValue } from "../networking/udt/PacketHeaders";
import assert from "../shared/assert";
import ContextManager from "../shared/ContextManager";


/*@devdoc
 *  The <code>AudioClient</code> class manages user client audio, sending and receiving audio packets and interfacing these
 *  with Web Audio streams.
 *  <p>C++: <code>AudioClient : public AbstractAudioInterface, public Dependency</code></p>
 *
 *  @class AudioClient
 *  @property {string} contextItemType="AudioClient" - The type name for use with the {@link ContextManager}.
 *      <p><em>Static. Read-only.</em></p>
 *
 *  @param {number} contextID - The {@link ContextManager} context ID.
 */
class AudioClient {
    // C++  AudioClient : public AbstractAudioInterface, public Dependency
    //      AbstractAudioInterface : public QObject

    static readonly contextItemType = "AudioClient";

    static readonly #RECEIVED_AUDIO_STREAM_CAPACITY_FRAMES = 100;


    // Context
    #_nodeList;
    #_packetReceiver;

    #_selectedCodecName = "";

    #_audioInput;
    #_isStereoInput = false;
    #_isMuted = false;

    #_dummyAudioInputTimer: ReturnType<typeof setTimeout> | null = null;
    #_outgoingAvatarAudioSequenceNumber = 0;

    #_receivedAudioStream;

    // WEBRTC TODO: Set these via the API.
    #_audioPosition = { x: 0, y: 1, z: 0 };
    #_audioOrientation = { x: 0, y: 0, z: 0, w: 1.0 };
    #_avatarBoundingBoxCorner = { x: -0.5, y: 0.0, z: -0.5 };
    #_avatarBoundingBoxScale = { x: 1, y: 2, z: 1 };


    constructor(contextID: number) {

        // Context
        this.#_nodeList = ContextManager.get(contextID, NodeList) as NodeList;
        this.#_packetReceiver = this.#_nodeList.getPacketReceiver();

        this.#_audioInput = new AudioInput();

        // This field is not a MixedProcessedAudioStream in the Web SDK version of AudioClient because the features of
        // MixedProcessedAudioStream haven't been needed so far.
        this.#_receivedAudioStream = new InboundAudioStream(contextID, AudioConstants.STEREO,
            AudioConstants.NETWORK_FRAME_SAMPLES_PER_CHANNEL, AudioClient.#RECEIVED_AUDIO_STREAM_CAPACITY_FRAMES, -1);

        // C++  Application::Application()
        this.#start();
        this.#_nodeList.nodeActivated.connect(this.#nodeActivated);
        this.#_nodeList.nodeKilled.connect(this.#nodeKilled);

        // C++  AudioClient::AudioClient()
        this.#_packetReceiver.registerListener(PacketType.SelectedAudioFormat,
            PacketReceiver.makeUnsourcedListenerReference(this.#handleSelectedAudioFormat));
        this.#_packetReceiver.registerListener(PacketType.SilentAudioFrame,
            PacketReceiver.makeUnsourcedListenerReference(this.#handleAudioDataPacket));
        this.#_packetReceiver.registerListener(PacketType.MixedAudio,
            PacketReceiver.makeUnsourcedListenerReference(this.#handleAudioDataPacket));
        this.#_packetReceiver.registerListener(PacketType.AudioStreamStats,
            PacketReceiver.makeSourcedListenerReference(this.#processStreamStatsPacket));
        this.#_packetReceiver.registerListener(PacketType.AudioEnvironment,
            PacketReceiver.makeUnsourcedListenerReference(this.#handleAudioEnvironmentDataPacket));
    }


    /*@devdoc
     *  Sets the MediaStream to use for audio input.
     *  @function AudioClient.switchInputDevice
     *  @param {MediaStream|null} inputDevice - The audio input stream from the user client to be sent to the audio mixer.
     *      <code>null</code> for no input device.
     */
    async switchInputDevice(inputDevice: MediaStream | null): Promise<boolean> {
        // C++  bool AudioClient::switchAudioDevice(QAudio::Mode mode, const HifiAudioDeviceInfo& deviceInfo)
        //      The mode parameter, which switches between input and output, isn't applicable to the SDK because the SDK output
        //      is always a MediaStream, not a particular device.
        //      The method has been renamed accordingly.
        //      The deviceInfo parameter has been repurposed to be an input MediaStream or null.
        return this.#switchInputToAudioDevice(inputDevice);
    }


    /*@devdoc
     *  Sets whether input audio is muted.
     *  @function AudioClient.setMuted
     *  @param {boolean} muted - <code>true</code> to mute the audio input so that it is not sent to the audio mixer,
     *      <code>false</code> to let it be sent.
     */
    setMuted(muted: boolean): void {
        // C++  void AudioClient::setMuted(bool muted, bool emitSignal)
        if (muted !== this.#_isMuted) {
            this.#_isMuted = muted;

            // WEBRTC TODO: Address further C++c code.
            // The emitSignal parameter is currently not used because it is for the scripting API.

            if (this.#_isMuted) {
                void this.#_audioInput.suspend();
            } else {
                void this.#_audioInput.resume();
            }

        }
    }

    /*@devdoc
     *  Gets whether audio input is muted.
     *  @function AudioClient.isMuted
     *  @returns {boolean} <code>true</code> if audio input is muted, <code>false</code> if it isn't.
     */
    isMuted(): boolean {
        // C++  bool isMuted()
        return this.#_isMuted;
    }


    #start(): void {
        // C++  void AudioClient::start()

        // WEBRTC TODO: Address further C++ code.

        void this.#switchInputToAudioDevice(null);
        // this.switchOutputToAudioDevice() is not used in the Web SDK.
    }

    async #switchInputToAudioDevice(inputDevice: MediaStream | null, isShutdownRequest = false): Promise<boolean> {
        // C++  bool switchInputToAudioDevice(const HifiAudioDeviceInfo inputDeviceInfo, bool isShutdownRequest = false)

        const inputDeviceAudioInfo = inputDevice ? inputDevice.getAudioTracks()[0] : null;
        const deviceName = inputDeviceAudioInfo ? inputDeviceAudioInfo.label : "";
        const inputDeviceAudioSettings = inputDeviceAudioInfo ? inputDeviceAudioInfo.getSettings() : null;
        let channelCount = 0;
        let sampleRate = 0;
        let sampleSize = 0;
        let echoCancellation = false;
        if (inputDeviceAudioSettings) {
            // FIXME: Typings currently don't include channelCount doesn't exist on MediaTrackSettings (Sep 2021).
            /* eslint-disable */
            // @ts-ignore
            channelCount = inputDeviceAudioSettings.channelCount ? inputDeviceAudioSettings.channelCount : 0;
            /* eslint-enable */
            sampleRate = inputDeviceAudioSettings.sampleRate ? inputDeviceAudioSettings.sampleRate : 0;
            sampleSize = inputDeviceAudioSettings.sampleSize ? inputDeviceAudioSettings.sampleSize : 0;
            echoCancellation = inputDeviceAudioSettings.echoCancellation
                ? inputDeviceAudioSettings.echoCancellation
                : false;
        }
        console.log("[audioclient] Input device info:", inputDeviceAudioSettings
            ? `${deviceName}, ${channelCount} channels, ${sampleRate}Hz, ${sampleSize} bits, `
                + `echo cancellation ${echoCancellation ? "on" : "off"}`
            : null);

        let supportedFormat = false;

        // The SDK just uses the number of channels that the input device has, up to a maximum of 2 (stereo).
        this.#_isStereoInput = channelCount >= 2;

        if (this.#_audioInput.isStarted()) {
            this.#_audioInput.readyRead.disconnect(this.#handleMicAudioInput);
            await this.#_audioInput.stop();
        }

        // WEBRTC TODO: Address further C++.

        if (this.#_dummyAudioInputTimer) {
            clearTimeout(this.#_dummyAudioInputTimer);
            this.#_dummyAudioInputTimer = null;
        }

        // WEBRTC TODO: Address further C++.

        if (isShutdownRequest) {
            console.log("[audioclient] The audio input device has shut down.");
            return true;
        }

        this.#_audioInput.audioInput = inputDevice;

        if (inputDevice) {

            assert(channelCount > 0);

            // WEBRTC TODO: Address further C++.

            let isStarted = false;
            await this.#_audioInput.start().then((started) => {
                isStarted = started;
            });

            if (isStarted) {
                this.#_audioInput.readyRead.connect(this.#handleMicAudioInput);
                supportedFormat = true;
            } else {
                console.error("[audioclient] Error starting audio input -", this.#_audioInput.errorString());
            }
        }

        if (!supportedFormat) {
            console.log("[audioclient] Audio input device is not available, using dummy input.");

            // WEBRTC TODO: Address further C++.

            this.#_dummyAudioInputTimer = setTimeout(() => {
                this.#handleDummyAudioInput();
            }, AudioConstants.NETWORK_FRAME_MSECS);
        }

        return supportedFormat;
    }

    #negotiateAudioFormat(): void {
        // C++  void negotiateAudioFormat()

        // WEBRTC TODO: Address further C++ code.
        const codecs = [
            // "opus",
            // "zlib",
            "pcm"
        ];

        const negotiateFormatPacket = PacketScribe.NegotiateAudioFormat.write({
            codecs
        });

        const audioMixer = this.#_nodeList.soloNodeOfType(NodeType.AudioMixer);
        if (audioMixer) {
            this.#_nodeList.sendPacket(negotiateFormatPacket, audioMixer);
        }
    }

    // eslint-disable-next-line class-methods-use-this
    #audioMixerKilled(): void {
        // C++  void AudioClient::audioMixerKilled()

        this.#_outgoingAvatarAudioSequenceNumber = 0;

        // WEBRTC TODO: Address further C++ code.

        if (this.#_audioInput.isStarted()) {
            void this.#_audioInput.stop();
        }
    }

    #handleAudioInput(audioBuffer: Int16Array | null): void {
        // C++  void AudioClient::handleAudioInput(QByteArray& audioBuffer)

        // An audio gate is not the responsibility of the AudioMixer SDK class.
        // The inputReceived signal is solely used for avatar recordings, the scripting API, and the audioscope.

        // WEBRTC TODO: Address further C++ code.

        const packetType = audioBuffer === null || this.#_isMuted
            ? PacketType.SilentAudioFrame
            : PacketType.MicrophoneAudioNoEcho;

        // WEBRTC TODO: Address further C++ code.

        // No codec support at present.
        const encodedAudio = audioBuffer ? new Uint8Array(audioBuffer.buffer) : null;

        this.#emitAudioPacket(packetType, encodedAudio);

        // WEBRTC TODO: Address further C++ code.

    }

    #handleDummyAudioInput(): void {
        // C++  void AudioClient::handleDummyAudioInput()

        this.#handleAudioInput(null);

        this.#_dummyAudioInputTimer = setTimeout(() => {
            this.#handleDummyAudioInput();
        }, AudioConstants.NETWORK_FRAME_MSECS);
    }

    #emitAudioPacket(packetType: PacketTypeValue, audioBuffer: Uint8Array | null): void {
        // C++  void AbstractAudioInterface::emitAudioPacket(const void* audioData, size_t bytes, quint16 & sequenceNumber,
        //          bool isStereo, const Transform& transform, glm::vec3 avatarBoundingBoxCorner,
        //          glm::vec3 avatarBoundingBoxScale, PacketType packetType, QString codecName)

        const audioMixer = this.#_nodeList.soloNodeOfType(NodeType.AudioMixer);
        if (!audioMixer || !audioMixer.getActiveSocket()) {
            return;
        }

        assert(packetType === PacketType.SilentAudioFrame || packetType === PacketType.MicrophoneAudioNoEcho);

        this.#_outgoingAvatarAudioSequenceNumber += 1;

        // WEBRTC TODO: Address further C++ code.

        let audioPacket: NLPacket | null = null;
        if (packetType === PacketType.SilentAudioFrame) {
            audioPacket = PacketScribe.SilentAudioFrame.write({
                sequenceNumber: this.#_outgoingAvatarAudioSequenceNumber,
                codecName: this.#_selectedCodecName,
                numSilentSamples: this.#_isStereoInput
                    ? AudioConstants.NETWORK_FRAME_SAMPLES_STEREO
                    : AudioConstants.NETWORK_FRAME_SAMPLES_PER_CHANNEL,
                audioPosition: this.#_audioPosition,
                audioOrientation: this.#_audioOrientation,
                avatarBoundingBoxCorner: this.#_avatarBoundingBoxCorner,
                avatarBoundingBoxScale: this.#_avatarBoundingBoxScale
            });
        } else {
            assert(audioBuffer !== null);
            audioPacket = PacketScribe.MicrophoneAudioNoEcho.write({
                sequenceNumber: this.#_outgoingAvatarAudioSequenceNumber,
                codecName: this.#_selectedCodecName,
                isStereo: this.#_isStereoInput,
                audioPosition: this.#_audioPosition,
                audioOrientation: this.#_audioOrientation,
                avatarBoundingBoxCorner: this.#_avatarBoundingBoxCorner,
                avatarBoundingBoxScale: this.#_avatarBoundingBoxScale,
                audioBuffer
            });
        }

        // WEBRTC TODO: Address further C++ code.

        this.#_nodeList.sendUnreliablePacket(audioPacket, audioMixer.getActiveSocket() as SockAddr,
            audioMixer.getAuthenticateHash());
    }

    #selectAudioFormat(selectedCodecName: string): void {
        // C++  void selectAudioFormat(const QString& selectedCodecName)

        this.#_selectedCodecName = selectedCodecName;

        console.log("[audioclient] Selected codec:", this.#_selectedCodecName, "; Is stereo input:", this.#_isStereoInput);

        // WEBRTC TODO: Address further C++ code.

        this.#_receivedAudioStream.cleanupCodec();
        this.#_receivedAudioStream.setupCodec(this.#_selectedCodecName);

        // WEBRTC TODO: Address further C++ code.

    }


    // Listener
    // eslint-disable-next-line class-methods-use-this
    #handleSelectedAudioFormat = (message: ReceivedMessage): void => {
        // C++  void handleSelectedAudioFormat(ReceivedMessage* message)

        const info = PacketScribe.SelectedAudioFormat.read(message.getMessage());
        this.#selectAudioFormat(info.selectedCodecName);
    };

    // Listener
    // eslint-disable-next-line class-methods-use-this
    #handleAudioDataPacket = (message: ReceivedMessage): void => {
        // C++  void handleAudioDataPacket(ReceivedMessage* message)

        // WEBRTC TODO: Address further C++ code.

        this.#_receivedAudioStream.parseData(message);
    };

    // Listener
    // eslint-disable-next-line
    // @ts-ignore
    #processStreamStatsPacket = (message: ReceivedMessage, sendingNode?: Node): void => {  // eslint-disable-line
        // C++  void AudioIOStats::processStreamStatsPacket(ReceivedMessage*, Node* sendingNode)

        console.warn("AudioClient: AudioStreamStats packet not processed.");

        // WEBRTC TODO: Address further C++ code.

    };

    // Listener
    // eslint-disable-next-line
    // @ts-ignore
    #handleAudioEnvironmentDataPacket = (message: ReceivedMessage): void => {  // eslint-disable-line
        // C++  void handleAudioEnvironmentDataPacket(ReceivedMessage* message)

        console.warn("AudioClient: AudioEnvironment packet not processed.");

        // WEBRTC TODO: Address further C++ code.

    };


    // Slot
    #nodeActivated = (node: Node): void => {
        // C++  Various
        const nodeType = node.getType();
        if (nodeType !== NodeType.AudioMixer) {
            return;
        }

        // C++  void Application::nodeActivated(Node* node)
        this.#negotiateAudioFormat();
    };

    // Slot
    #nodeKilled = (node: Node): void => {
        // C++  Various
        const nodeType = node.getType();
        if (nodeType !== NodeType.AudioMixer) {
            return;
        }

        // C++  void Application::nodeKilled(Node* node)
        this.#audioMixerKilled();
    };

    // Slot
    #handleMicAudioInput = (): void => {
        // C++  void AudioClient::handleMicAudioInput()

        // The input buffering and chunking into packet-sized data is implemented in AudioInputProcessor.

        // WEBRTC TODO: Address further C++ code.

        while (this.#_audioInput.hasPendingFrame()) {
            const pcmData = this.#_audioInput.readFrame();

            // WEBRTC TODO: Address further C++ code.

            this.#handleAudioInput(pcmData);
        }
    };

}

export default AudioClient;

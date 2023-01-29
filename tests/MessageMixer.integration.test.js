//
//  MessageMixer.integration.test.js
//
//  Created by David Rowe on 19 Aug 2021.
//  Copyright 2021 Vircadia contributors.
//  Copyright 2021 DigiSomni LLC.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

import DomainServer from "../src/DomainServer";
import MessageMixer from "../src/MessageMixer";

import "wrtc";  // WebRTC Node.js package.

import { webcrypto } from "crypto";
globalThis.crypto = webcrypto;

import TestConfig from "./test.config.js";


// Time needs to be allowed for the WebRTC RTCPeerConnection from one test to be closed before creating a new one in the
// next test.
// https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/close
function waitUntilDone(done, extraTimeout = 0) {
    const DONE_TIMEOUT = 500;
    setTimeout(() => {
        done();  // eslint-disable-line
    }, DONE_TIMEOUT + extraTimeout);
}


describe("MessageMixer - integration tests", () => {

    //  Test environment expected: Domain server that allows anonymous logins running on localhost or other per TestConfig.

    // Add WebSocket and WebRTC to Node.js environment.
    global.WebSocket = require("ws");  // eslint-disable-line
    global.RTCPeerConnection = require("wrtc").RTCPeerConnection;  // eslint-disable-line

    /* eslint-disable @typescript-eslint/no-magic-numbers */

    // Increase the Jest timeout from the default 5s.
    jest.setTimeout(10000);

    // Suppress console.log messages from being displayed.
    const log = jest.spyOn(console, "log").mockImplementation(() => { /* no-op */ });
    const warn = jest.spyOn(console, "warn").mockImplementation(() => { /* no-op */ });
    const error = jest.spyOn(console, "error").mockImplementation((...message) => {
        const errorMessage = message.join(" ");
        // eslint-disable-next-line
        expect(errorMessage).toBe("[networking] Public key upload to metaverse failed: https://metaverse.vircadia.com/live/api/v1/user/public_key Not authenticated");
    });


    test("States when connect to and disconnect from a domain", (done) => {
        const domainServer = new DomainServer();
        const messageMixer = new MessageMixer(domainServer.contextID);
        expect(messageMixer.state).toBe(MessageMixer.UNAVAILABLE);
        let haveSeenDisconnected = false;
        let haveRequestedDisconnect = false;

        messageMixer.onStateChanged = (state) => {
            haveSeenDisconnected = haveSeenDisconnected || messageMixer.state === MessageMixer.DISCONNECTED;
            if (state === MessageMixer.CONNECTED) {
                expect(haveSeenDisconnected).toBe(true);  // eslint-disable-line jest/no-conditional-expect
                setTimeout(() => {
                    haveRequestedDisconnect = true;
                    domainServer.disconnect();
                }, 0);
            } else if (state === MessageMixer.UNAVAILABLE && haveRequestedDisconnect) {
                messageMixer.onStateChanged = null;
                waitUntilDone(done);
            }
        };
        domainServer.connect(TestConfig.SERVER_SIGNALING_SOCKET_URL);
    });

    test("Can send and receive a multi-packet message", (done) => {
        let domainServer = new DomainServer();
        let messageMixer = new MessageMixer(domainServer.contextID);
        expect(messageMixer.state).toBe(MessageMixer.UNAVAILABLE);
        let haveSeenDisconnected = false;
        let haveRequestedDisconnect = false;
        const TEST_CHANNEL = "com.vircadia.test.messagemixer.integration.b";
        // eslint-disable-next-line max-len
        const TEST_MESSAGE = "THESTART99888888888877777777776666666666555555555544444444443333333333222222222211111111110000000000__________888888888877777777776666666666555555555544444444443333333333222222222211111111110000000000999999999988888888887777777777666666666655555555554444444444333333333322222222221111111111000000000099999999998888888888777777777766666666665555555555444444444433333333332222222222111111111100000000009999999999888888888877777777776666666666555555555544444444443333333333222222222211111111110000000000999999999988888888887777777777666666666655555555554444444444333333333322222222221111111111000000000099999999998888888888777777777766666666665555555555444444444433333333332222222222111111111100000000009999999999888888888877777777776666666666555555555544444444443333333333222222222211111111110000000000999999999988888888887777777777666666666655555555554444444444333333333322222222221111111111000000000099999999998888888888777777777766666666665555555555444444444433333333332222222222111111111100000000009999999999888888888877777777776666666666555555555544444444443333333333222222222211111111110000000000999999999988888888887777777777666666666655555555554444444444333333333322222222221111111111000000000099999999998888888888777777777766666666665555555555444444444433333333332222222222111111111100000000009999999999888888888877777777776666666666555555555544444444443333333333222222222211111111110000000000999999999988888888887777777777666666666655555555554444444444333333333322222222221111111111000000000099999999998888888888777777777766666666665555555555444444444433333333332222222222111111111100000000009999999999888888888877777777776666666666555555555544444444443333333333222222222211111111110000000000999999999988888888887777777777666666666655555555554444444444333333333322222222221111111111000000000099999999998888888888777777777766666666665555555555444444444433333333332222222222111111111100000000009999999999888888888877777777776666666666555555555544444444443333333333222222222211111111110000000000999999999988888888887777777777666666666655555555554444444444333333333322222222221111111111000000000099999999998888888888777777777766666666665555555555444444444433333333332222222222111111111100000000009999999999888888888877777777776666666666555555555544444444443333333333222222222211111111110000000000999999999988888888887777777777666666666655555555554444444444333333333322222222221111111111000000000099999999998888888888777777777766666666665555555555444444444433333333332222222222111111111100000000009999999999888888888877777777776666666666555555555544444444443333333333222222222211111111110000000000999999999988888888887777777777666666666655555555554444444444333333333322222222221111111111000000000099999999998888888888777777777766666666665555555555444444444433333333332222222222111111111100000000009999999999888888888877777777776666666666555555555544444444443333333333222222222211111111110000000000999999999988888888887777777777666666666655555555554444444444333333333322222222221111111111000000000099999999998888888888777777777766666666665555555555444444444433333333332222222222111111111100000000009999999999888888888877777777776666666666555555555544444444443333333333222222222211111111110000000000999999999988888888887777777777666666666655555555554444444444333333333322222222221111111111000000000099999999998888888888777777777766666666665555555555444444444433333333332222222222111111111100000000009999999999888888888877777777776666666666555555555544444444443333333333222222222211111111110000000000999999999988888888887777777777666666666655555555554444444444333333333322222222221111111111000000000099999999998888888888777777777766666666665555555555444444444433333333332222222222111111111100000000009999999999888888888877777777776666666666555555555544444444443333333333222222222211111111110000000000999999999988888888887777777777666666666655555555554444444444333333333322222222221111111111000000000099999999998888888888777777777766666666665555555555444444444433333333332222222222111111111100000000009999999999888888888877777777776666666666555555555544444444443333333333222222222211111111110000000000ALMOST9999999999888888888877777777776666666666555555555544444444443333333333222222222211111111110000000000THEEND";
        /* eslint-disable jest/no-conditional-expect */

        messageMixer.onStateChanged = (state) => {
            haveSeenDisconnected = haveSeenDisconnected || messageMixer.state === MessageMixer.DISCONNECTED;
            if (state === MessageMixer.CONNECTED) {
                expect(haveSeenDisconnected).toBe(true);  // eslint-disable-line jest/no-conditional-expect

                messageMixer.subscribe(TEST_CHANNEL);
                messageMixer.messageReceived.connect((channel, message, senderID, localOnly) => {
                    if (channel === TEST_CHANNEL) {
                        expect(message).toBe(TEST_MESSAGE);
                        // WEBRTC TODO: Check senderID value when this is available in the API.
                        expect(localOnly).toBe(false);
                    }
                    setTimeout(() => {
                        haveRequestedDisconnect = true;
                        domainServer.disconnect();
                    }, 0);
                });
                setTimeout(() => {
                    messageMixer.sendMessage(TEST_CHANNEL, TEST_MESSAGE);
                }, 100);

            } else if (state === MessageMixer.UNAVAILABLE && haveRequestedDisconnect) {
                messageMixer.onStateChanged = null;
                messageMixer = null;
                domainServer = null;
                // WEBRTC TODO: Remove this extra timeout once object tear-down has been implemented.
                const EMPTY_QUEUES_INACTIVE_TIMEOUT_MS = 5000;
                waitUntilDone(done, EMPTY_QUEUES_INACTIVE_TIMEOUT_MS);
            }
        };
        domainServer.connect(TestConfig.SERVER_SIGNALING_SOCKET_URL);

        /* eslint-ENable jest/no-conditional-expect */
    });


    error.mockReset();
    warn.mockReset();
    log.mockReset();
});

//
//  AudioMixer.unit.test.js
//
//  Created by David Rowe on 24 Aug 2021.
//  Copyright 2021 Vircadia contributors.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

import DomainServer from "../src/DomainServer";
import AudioMixer from "../src/AudioMixer";


describe("AudioMixer - unit tests", () => {

    const log = jest.spyOn(console, "log").mockImplementation(() => { /* no-op */ });


    test("Can create an AudioMixer with a DomainServer", () => {
        const domainServer = new DomainServer();
        const audioMixer = new AudioMixer(domainServer.contextID);
        expect(audioMixer instanceof AudioMixer).toBe(true);

        expect(audioMixer.state).toBe(AudioMixer.UNAVAILABLE);
    });

    test("Can set an audio getter function", () => {
        const domainServer = new DomainServer();
        const audioMixer = new AudioMixer(domainServer.contextID);
        const error = jest.spyOn(console, "error").mockImplementation(() => { /* no-op */ });

        // Not a function.
        audioMixer.positionGetter = {};
        expect(error).toHaveBeenCalledTimes(1);

        // Invalid function.
        audioMixer.positionGetter = () => {
            return { x: 1, y: 2, z: 3, w: 4 };
        };
        expect(error).toHaveBeenCalledTimes(2);

        // Valid function.
        audioMixer.positionGetter = () => {
            return { x: 1, y: 2, z: 3 };
        };
        expect(error).toHaveBeenCalledTimes(2);

        error.mockReset();
    });


    log.mockReset();
});

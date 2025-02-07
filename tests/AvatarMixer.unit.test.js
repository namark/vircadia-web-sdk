//
//  AvatarMixer.unit.test.js
//
//  Created by David Rowe on 24 Aug 2021.
//  Copyright 2021 Vircadia contributors.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

import DomainServer from "../src/DomainServer";
import AvatarMixer from "../src/AvatarMixer";


describe("AvatarMixer - unit tests", () => {

    test("Can create an AvatarMixer with a DomainServer", () => {
        const domainServer = new DomainServer();
        const avatarMixer = new AvatarMixer(domainServer.contextID);
        expect(avatarMixer instanceof AvatarMixer).toBe(true);

        expect(avatarMixer.state).toBe(AvatarMixer.UNAVAILABLE);
    });

});

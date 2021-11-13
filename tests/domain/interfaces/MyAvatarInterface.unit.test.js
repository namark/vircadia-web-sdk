//
//  MyAvatarInterface.unit.test.js
//
//  Created by David Rowe on 31 Oct 2021.
//  Copyright 2021 Vircadia contributors.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

/* eslint-disable @typescript-eslint/no-magic-numbers */

import AvatarManager from "../../../src/domain/AvatarManager";
import MyAvatarInterface from "../../../src/domain/interfaces/MyAvatarInterface";
import ContextManager from "../../../src/domain/shared/ContextManager";
import DomainServer from "../../../src/DomainServer";


describe("MyAvatarInterface - unit tests", () => {

    test("Can access the signals", () => {
        const domainServer = new DomainServer();
        const contextID = domainServer.contextID;
        ContextManager.set(contextID, AvatarManager, contextID);
        const myAvatarInterface = new MyAvatarInterface(contextID);
        expect(typeof myAvatarInterface.displayNameChanged.connect).toBe("function");
        expect(typeof myAvatarInterface.displayNameChanged.disconnect).toBe("function");
        expect(typeof myAvatarInterface.sessionDisplayNameChanged.connect).toBe("function");
        expect(typeof myAvatarInterface.sessionDisplayNameChanged.disconnect).toBe("function");
    });

});

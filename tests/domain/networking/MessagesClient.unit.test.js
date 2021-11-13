//
//  MessagesClient.unit.test.js
//
//  Created by David Rowe on 2 Oct 2021.
//  Copyright 2021 Vircadia contributors.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

import DomainServer from "../../../src/DomainServer";
import MessagesClient from "../../../src/domain/networking/MessagesClient";


describe("MessagesClient - unit tests", () => {

    test("Can subscribe to and unsubscribe from a channel", () => {
        const domainServer = new DomainServer();
        const messagesClient = new MessagesClient(domainServer.contextID);

        const error = jest.spyOn(console, "error").mockImplementation(() => { /* no-op */ });
        messagesClient.subscribe("com.vircadia.test.unit");
        messagesClient.unsubscribe("com.vircadia.test.unit");
        expect(error).toHaveBeenCalledTimes(0);
        error.mockReset();
    });

});

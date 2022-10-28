const PubNub = require("pubnub");
const uuid = PubNub.generateUUID();

const pubnub = new PubNub({
  // publishKey: "pub-c-ee8d5114-572e-40bd-bb92-6b00b09fc202",
  // subscribeKey: "sub-c-6c7df15a-c787-11ec-8c08-82b465a2b170",
  publishKey: "pub-c-90d5fa5c-df63-46c7-b5f2-2d6ad4efd775",
  subscribeKey: "sub-c-81c16c55-f391-4f72-8e57-2d9e052a360c",
  //uuid: uuid,
  restore: true,
  // presenceTimeout: 20,
  autoNetworkDetection : true,
  userId: uuid,
  //keepAlive : true,
});

module.exports = { pubnub };

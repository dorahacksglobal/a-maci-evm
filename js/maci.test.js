const fs = require("fs");
const path = require("path");
const { groth16 } = require("snarkjs");
const { poseidon } = require("circom");
const { stringizing, genKeypair, genStaticRandomKey } = require("./keypair");
const MACI = require("./maci");
const { genMessage } = require("./client");
const { proofAddKey } = require("./proofAddKey");
const { proofDeactivate } = require("./proofDeactivate");

const outputPath = process.argv[2];
if (!outputPath) {
  console.log("no output directory is specified");
  process.exit(1);
}

const maxVoteOptions = 5;

const main = async () => {
  const USER_1 = 0; // state leaf idx
  const USER_2 = 1; // state leaf idx
  const USER_1A = 2; // state leaf idx

  const privateKeys = [
    111111n, // coordinator
    222222n, // user 1
    333333n, // share key for message 1
    444444n, // share key for message 2
    555555n, // user 2
    666666n, // add new key
  ];
  const coordinator = genKeypair(privateKeys[0]);
  const user1 = genKeypair(privateKeys[1]);
  const user2 = genKeypair(privateKeys[4]);

  const main = new MACI(
    2,
    1,
    1,
    5, // tree config
    privateKeys[0], // coordinator
    maxVoteOptions,
    3,
    true
  );

  main.initStateTree(USER_1, user1.pubKey, 100);
  main.initStateTree(USER_2, user2.pubKey, 100);

  const enc1 = genKeypair(privateKeys[2]);

  // const dmessage1 = genMessage(enc1.privKey, coordinator.pubKey)(
  //   USER_1,
  //   0,
  //   0,
  //   0,
  //   [0n, 0n],
  //   user1.privKey,
  //   1234567890n
  // );

  // const enc2 = genKeypair(privateKeys[3]);

  // const dmessage2 = genMessage(enc2.privKey, coordinator.pubKey)(
  //   USER_2,
  //   0,
  //   0,
  //   0,
  //   [0n, 0n],
  //   user2.privKey,
  //   1234567890n
  // );

  // main.pushDeactivateMessage(dmessage1, enc1.pubKey);
  // main.pushDeactivateMessage(dmessage2, enc2.pubKey);

  const logs = main.logs;

  // const { input, newDeactivate } = main.processDeactivateMessage(2, 2);

  // fs.writeFileSync(
  //   path.join(outputPath, "deactivate-input.json"),
  //   JSON.stringify(stringizing(input), undefined, 2)
  // );

  // const dProof = await proofDeactivate({
  //   input,
  //   size: 2,
  // });

  // logs.push({
  //   type: "proofDeactivate",
  //   data: dProof,
  // });

  console.log("proofDeactivate DONE");

  // console.log({
  //   deactivateRoot: input.newDeactivateRoot,
  //   deactivateCommitment: input.newDeactivateCommitment,
  // });

  // user 1
  // const user1a = genKeypair(privateKeys[5]);
  // const res = await proofAddKey({
  //   coordPubKey: coordinator.pubKey,
  //   oldKey: user1,
  //   deactivates: newDeactivate,
  //   dIdx: 0,
  // });
  // main.initStateTree(USER_1A, user1a.pubKey, 100, res.proof.d);

  // fs.writeFileSync(
  //   path.join(outputPath, "addnewkey-input.json"),
  //   JSON.stringify(stringizing(res.input), undefined, 2)
  // );

  // console.log(addNewKey);

  // logs.push({
  //   type: "proofAddNewKey",
  //   data: {
  //     pubKey: stringizing(user1a.pubKey),
  //     ...res.proof,
  //   },
  // });

  console.log("proofAddNewKey DONE");

  // fs.writeFileSync(
  //   path.join(outputPath, "input.json"),
  //   JSON.stringify(stringizing(input), undefined, 2)
  // );

  // VOTE PROCESS

  const message1 = genMessage(enc1.privKey, coordinator.pubKey)(
    USER_1,
    1,
    1,
    8,
    user1.pubKey,
    user1.privKey,
    1234567890n
  );
  main.pushMessage(message1, enc1.pubKey);

  const enc3 = genKeypair(privateKeys[5]);
  const message3 = genMessage(enc3.privKey, coordinator.pubKey)(
    USER_2,
    1,
    2,
    12,
    user2.pubKey,
    user2.privKey,
    1234567890n
  );
  main.pushMessage(message3, enc3.pubKey);

  // const message2 = genMessage(enc2.privKey, coordinator.pubKey)(
  //   USER_1A,
  //   1,
  //   2,
  //   6,
  //   user1a.pubKey,
  //   user1a.privKey,
  //   9876543210n
  // );
  // main.pushMessage(message2, enc2.pubKey);

  main.endVotePeriod();

  // PROCESSING
  let i = 0;
  while (main.states === 1) {
    const inputs = [];
    const input = main.processMessage(
      genStaticRandomKey(coordinator.privKey, 20041n, BigInt(i)),
      inputs
    );

    // const res = await groth16.fullProve(
    //   input,
    //   "./build/msg_js/msg.wasm",
    //   "./build/zkey/msg_0.zkey"
    // );

    // logs.push({
    //   type: "processMessage",
    //   data: stringizing({
    //     proof: res.proof,
    //     newStateCommitment: input.newStateCommitment,
    //   }),
    //   inputs,
    // });

    fs.writeFileSync(
      path.join(outputPath, `msg-input_${i.toString().padStart(4, "0")}.json`),
      JSON.stringify(stringizing(input), undefined, 2)
    );
    i++;
  }

  // TALLYING
  i = 0;
  let salt = 0n;
  while (main.states === 2) {
    const inputs = [];
    const input = main.processTally(
      genStaticRandomKey(coordinator.privKey, 20042n, BigInt(i)),
      inputs
    );

    // const res = await groth16.fullProve(
    //   input,
    //   "./build/tally_js/tally.wasm",
    //   "./build/zkey/tally_0.zkey"
    // );

    salt = input.newResultsRootSalt;

    // logs.push({
    //   type: "processTally",
    //   data: stringizing({
    //     proof: res.proof,
    //     newTallyCommitment: input.newTallyCommitment,
    //   }),
    //   inputs,
    // });
    fs.writeFileSync(
      path.join(
        outputPath,
        `tally-input_${i.toString().padStart(4, "0")}.json`
      ),
      JSON.stringify(stringizing(input), undefined, 2)
    );
    i++;
  }

  const results = main.tallyResults.leaves().slice(0, maxVoteOptions);

  logs.push({
    type: "stopTallyingPeriod",
    data: stringizing({
      results,
      salt,
    }),
  });

  fs.writeFileSync(
    path.join(outputPath, "logs.json"),
    JSON.stringify(stringizing(logs), undefined, 2)
  );

  console.log("DONE");

  process.exit(0);
};

main();

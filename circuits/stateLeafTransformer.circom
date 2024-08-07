pragma circom 2.0.0;

include "./messageValidator.circom";
include "./lib/rerandomize.circom";
include "../node_modules/circomlib/circuits/mux1.circom";

/*
 * Apply a command to a state leaf and ballot.
 */
template StateLeafTransformer() {
    var PACKED_CMD_LENGTH = 3;

    signal input coordPrivKey;

    // For the MessageValidator
    signal input numSignUps;
    signal input maxVoteOptions;

    // State leaf
    signal input slPubKey[2];
    signal input slVoiceCreditBalance;
    // signal input slTimestamp;
    // signal input pollEndTimestamp;
    signal input slNonce;

    signal input slC1[2];
    signal input slC2[2];
    // signal input slXIncrement;

    signal input currentVotesForOption;

    // Command
    signal input cmdStateIndex;
    signal input cmdNewPubKey[2];
    signal input cmdVoteOptionIndex;
    signal input cmdNewVoteWeight;
    signal input cmdNonce;
    // signal input cmdPollId;
    // signal input cmdSalt;
    signal input cmdSigR8[2];
    signal input cmdSigS;
    // Note: we assume that packedCommand is valid!
    signal input packedCommand[PACKED_CMD_LENGTH];

    signal input deactivate;

    // New state leaf (if the command is valid)
    signal output newSlPubKey[2];

    // New ballot (if the command is valid)
    signal output newSlNonce;
    signal output isValid;

    // Check if the command / message is valid
    component messageValidator = MessageValidator();
    messageValidator.stateTreeIndex <== cmdStateIndex;
    messageValidator.numSignUps <== numSignUps;
    messageValidator.voteOptionIndex <== cmdVoteOptionIndex;
    messageValidator.maxVoteOptions <== maxVoteOptions;
    messageValidator.originalNonce <== slNonce;
    messageValidator.nonce <== cmdNonce;
    for (var i = 0; i < PACKED_CMD_LENGTH; i ++) {
        messageValidator.cmd[i] <== packedCommand[i];
    }
    messageValidator.pubKey[0] <== slPubKey[0];
    messageValidator.pubKey[1] <== slPubKey[1];
    messageValidator.sigR8[0] <== cmdSigR8[0];
    messageValidator.sigR8[1] <== cmdSigR8[1];
    messageValidator.sigS <== cmdSigS;

    messageValidator.currentVoiceCreditBalance <== slVoiceCreditBalance;
    // messageValidator.slTimestamp <== slTimestamp;
    // messageValidator.pollEndTimestamp <== pollEndTimestamp;
    messageValidator.currentVotesForOption <== currentVotesForOption;
    messageValidator.voteWeight <== cmdNewVoteWeight;

    component decryptIsActive = ElGamalDecrypt();
    decryptIsActive.c1[0] <== slC1[0];
    decryptIsActive.c1[1] <== slC1[1];
    decryptIsActive.c2[0] <== slC2[0];
    decryptIsActive.c2[1] <== slC2[1];
    // decryptIsActive.xIncrement <== slXIncrement;
    decryptIsActive.privKey <== coordPrivKey;
    // component isActive = IsZero();
    // isActive.in <== decryptIsActive.out;

    component activate = IsZero();
    activate.in <== deactivate;

    component valid = IsEqual();
    valid.in[0] <== 3;
    valid.in[1] <== 1 - decryptIsActive.isOdd +
                    activate.out + 
                    messageValidator.isValid;

    component newSlPubKey0Mux = Mux1();
    newSlPubKey0Mux.s <== valid.out;
    newSlPubKey0Mux.c[0] <== slPubKey[0];
    newSlPubKey0Mux.c[1] <== cmdNewPubKey[0];
    newSlPubKey[0] <== newSlPubKey0Mux.out;

    component newSlPubKey1Mux = Mux1();
    newSlPubKey1Mux.s <== valid.out;
    newSlPubKey1Mux.c[0] <== slPubKey[1];
    newSlPubKey1Mux.c[1] <== cmdNewPubKey[1];
    newSlPubKey[1] <== newSlPubKey1Mux.out;

    component newSlNonceMux = Mux1();
    newSlNonceMux.s <== valid.out;
    newSlNonceMux.c[0] <== slNonce;
    newSlNonceMux.c[1] <== cmdNonce;
    newSlNonce <== newSlNonceMux.out;

    isValid <== valid.out;
}

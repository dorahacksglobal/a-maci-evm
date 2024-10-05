const { utils } = require("ethers");
const crypto = require("crypto");
const { genKeypair } = require("./js/keypair");
const { poseidon } = require("circom");

// const a = utils.soliditySha256(new Array(3).fill("uint256"), [
//   "4586742648735347023140975694515127820223737342202645415801788479865970064865",
//   "13054482736408504067865054704459445250728031282933547097347379541910876596955",
//   "1",
// ]);

// const b = crypto
//   .createHash("sha256")
//   .update(
//     Buffer.from(
//       "0a24011c716ea677080bc03360349be1133f350019bb4e230170a8968df57de11cdc934c996b3072998c07e49b41191d3b73f1c0d2f8d3c5fb0b3f51b1582adb0000000000000000000000000000000000000000000000000000000000000001",
//       "hex"
//     )
//   )
//   .digest("hex");

// console.log(a, b);

// const accout = genKeypair(0n);
// console.log(accout);
// console.log(genKeypair(1n));
// console.log(poseidon(accout.pubKey));

// console.log(
//   BigInt("0xd53841ab0494365b341d519dcfaf0f69e375ffa406eb4484d38f55e9bdef10b")
// );

console.log(
  poseidon([
    8780172783605990534393632644657063981163404570392941354589839252371148590925n,
    18127908072205049515869530689345374790252438412920611306083118152373728836259n,
    18127908072205049515869530689345374790252438412920611306083118152373728836259n,
    18127908072205049515869530689345374790252438412920611306083118152373728836259n,
    18127908072205049515869530689345374790252438412920611306083118152373728836259n,
  ])
);

/**
 * 本脚本是用来模拟如何生成一个 pre-deactivate 的 state tree
 * 用以在一个 aMACI 中匿名注册所有的用户
 */

const { poseidon } = require("circom");
const { genRandomKey, genKeypair, genEcdhSharedKey } = require("./keypair");
const { encryptOdevity } = require("./rerandomize");
const Tree = require("./tree");

// STEP 0: 生成一个 coordinator
const coordinator = genKeypair();

// STEP 1: 生成若干个账户
const accounts = [];
for (let i = 0; i < 10; i++) {
  accounts.push(genKeypair());
}

// STEP 2: 生成每一个 deactivate state tree leaf
const deactivates = accounts.map((u) => {
  const sharedKey = genEcdhSharedKey(coordinator.privKey, u.pubKey);

  const deactivate = encryptOdevity(
    false, // isOdd: 根据和电路一致的规则，奇数表明账户有效，偶数表明账户无效。所以这里永远设置为 false 以保证可以有效进行 signup
    coordinator.pubKey,
    genRandomKey()
  );

  /**
   * @type {[bigint,bigint,bigint,bigint,bigint]}
   */
  const dLeaf = [
    deactivate.c1.x,
    deactivate.c1.y,
    deactivate.c2.x,
    deactivate.c2.y,
    poseidon(sharedKey),
  ];

  return dLeaf;
});

// STEP 3: 生成 tree root
const DEGREE = 5;
const DEPTH = 3;
const ZERO = 0n;
const tree = new Tree(DEGREE, DEPTH, ZERO);
const leaves = deactivates.map((d) => poseidon(d));
tree.initLeaves(leaves);

const preDeactivateRoot = tree.root;

console.log("preDeactivateRoot", preDeactivateRoot);
// console.log("deactivates", deactivates); // 太长了，跳过打印

// 验证阶段
// - deactivates 是需要放在一个地方公开给用户的 bigint[][] 信息，在 Pre-AddNewKey 过程中，直接用这个信息而不需要从链上获取 deactivates 信息
// - preDeactivateRoot 需要登记进合约，很容易验证 preDeactivateRoot 和 deactivates 之间的一致性

// 模拟一个用户如何准备开始 Pre-AddNewKey

const randomUserIdx = Math.floor(Math.random() * accounts.length);
const user = accounts[randomUserIdx];

/**
 * 做一个简化版本的 gen proof 函数
 * 不生成所有 gen proof 需要的 input，只要能正常进行基本的数据确认工作即可
 */
const simpleGenAddKeyProof = (depth, { coordPubKey, oldKey, deactivates }) => {
  const sharedKeyHash = poseidon(genEcdhSharedKey(oldKey.privKey, coordPubKey));

  const deactivateIdx = deactivates.findIndex((d) => d[4] === sharedKeyHash);
  if (deactivateIdx < 0) {
    return null;
  }

  const deactivateLeaf = deactivates[deactivateIdx];

  const c1 = [deactivateLeaf[0], deactivateLeaf[1]];
  const c2 = [deactivateLeaf[2], deactivateLeaf[3]];

  // const randomVal = genRandomKey();
  // const { d1, d2 } = rerandomize(coordPubKey, { c1, c2 }, randomVal)
  // const nullifier = poseidon([oldKey.formatedPrivKey, 1444992409218394441042n])

  // const tree = new Tree(5, depth, 0n)
  // const leaves = deactivates.map((d) => poseidon(d))
  // tree.initLeaves(leaves)

  // const deactivateRoot = tree.root
  // const deactivateLeafPathElements = tree.pathElementOf(deactivateIdx)

  // const inputHash =
  //   BigInt(
  //     solidityPackedSha256(
  //       new Array(7).fill('uint256'),
  //       stringizing([
  //         deactivateRoot,
  //         poseidon(coordPubKey),
  //         nullifier,
  //         d1[0],
  //         d1[1],
  //         d2[0],
  //         d2[1],
  //       ])
  //     )
  //   ) % SNARK_FIELD_SIZE

  // const input = {
  //   inputHash,
  //   coordPubKey,
  //   deactivateRoot,
  //   deactivateIndex: deactivateIdx,
  //   deactivateLeaf: poseidon(deactivateLeaf),
  //   c1,
  //   c2,
  //   randomVal,
  //   d1,
  //   d2,
  //   deactivateLeafPathElements,
  //   nullifier,
  //   oldPrivateKey: oldKey.formatedPrivKey,
  // }

  // return input

  return { c1, c2 };
};

const input = simpleGenAddKeyProof(DEPTH, {
  coordPubKey: coordinator.pubKey,
  oldKey: user,
  deactivates,
});

console.log("user index", randomUserIdx);
console.log("input", input); // 输出不应该为 null

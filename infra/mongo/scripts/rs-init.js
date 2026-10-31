const replicaSetName = "indic_search-rs";

const config = {
  _id: replicaSetName,
  members: [
    { _id: 0, host: "host.docker.internal:27017", priority: 2 },
    { _id: 1, host: "host.docker.internal:27018", priority: 1 },
    { _id: 2, host: "host.docker.internal:27019", priority: 1 },
  ],
};

function alreadyInitiated() {
  try {
    const status = rs.status();
    return status.ok === 1 && status.set === replicaSetName;
  } catch {
    return false;
  }
}

if (alreadyInitiated()) {
  print("indic-search-rs already initiated, checking member addresses");
  const conf = rs.conf();
  const expectedHosts = config.members.map((member) => member.host);
  const needsReconfig =
    conf.members.length !== expectedHosts.length ||
    conf.members.some((member, index) => member.host !== expectedHosts[index]);
  if (needsReconfig) {
    print("Reconfiguring replica set members to host-published addresses");
    conf.members = config.members;
    const result = rs.reconfig(conf);
    printjson(result);
  }
} else {
  print("initiating indic-search-rs");
  const result = rs.initiate(config);
  printjson(result);
  if (result.ok !== 1) {
    throw new Error("rs.initiate failed");
  }
}

const deadline = Date.now() + 60000;
while (Date.now() < deadline) {
  try {
    if (db.hello().isWritablePrimary) {
      break;
    }
  } catch {
    // election in progress
  }
  sleep(1000);
}

if (!db.hello().isWritablePrimary) {
  throw new Error("timed out waiting for PRIMARY");
}

const concern = db.adminCommand({
  setDefaultRWConcern: 1,
  defaultWriteConcern: { w: "majority" },
});
printjson(concern);

print("indic-search-rs ready, w:majority");

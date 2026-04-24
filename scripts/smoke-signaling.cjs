const { spawn } = require("node:child_process");
const http = require("node:http");
const WebSocket = require("ws");

const PORT = 8092;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getJson(path) {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://localhost:${PORT}${path}`, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(error);
        }
      });
    });
    req.on("error", reject);
  });
}

async function runWsFlow() {
  const url = `ws://localhost:${PORT}`;
  const sender = new WebSocket(url);
  const receiver = new WebSocket(url);

  let code = "";
  let receiverToken = "";
  let offerRelayed = false;
  let answerRelayed = false;

  const cleanup = () => {
    sender.close();
    receiver.close();
  };

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("websocket_flow_timeout"));
    }, 8000);

    sender.on("message", (raw) => {
      const msg = JSON.parse(String(raw));
      if (msg.type === "connected") {
        sender.send(JSON.stringify({ type: "create_session" }));
      }
      if (msg.type === "session_created") {
        code = msg.code;
        receiver.send(JSON.stringify({ type: "join_session", code }));
      }
      if (msg.type === "peer_joined") {
        sender.send(JSON.stringify({ type: "signal", signalType: "offer", payload: { type: "offer", sdp: "x" } }));
      }
      if (msg.type === "signal" && msg.signalType === "answer") {
        answerRelayed = true;
        if (offerRelayed && answerRelayed) {
          clearTimeout(timeout);
          resolve();
        }
      }
      if (msg.type === "error") {
        clearTimeout(timeout);
        reject(new Error(`sender_error:${msg.code}`));
      }
    });

    receiver.on("message", (raw) => {
      const msg = JSON.parse(String(raw));
      if (msg.type === "session_joined") {
        receiverToken = msg.token;
      }
      if (msg.type === "signal" && msg.signalType === "offer") {
        offerRelayed = true;
        receiver.send(JSON.stringify({ type: "signal", signalType: "answer", payload: { type: "answer", sdp: "y" } }));
      }
      if (msg.type === "error") {
        clearTimeout(timeout);
        reject(new Error(`receiver_error:${msg.code}`));
      }
    });
  });

  if (!receiverToken || !code) {
    cleanup();
    throw new Error("missing_reconnect_material");
  }

  receiver.close();
  await wait(250);

  await new Promise((resolve, reject) => {
    const reconnect = new WebSocket(url);
    const timeout = setTimeout(() => {
      reconnect.close();
      reject(new Error("reconnect_timeout"));
    }, 5000);

    reconnect.on("message", (raw) => {
      const msg = JSON.parse(String(raw));
      if (msg.type === "connected") {
        reconnect.send(JSON.stringify({ type: "reconnect_session", code, token: receiverToken }));
      }
      if (msg.type === "session_reconnected") {
        clearTimeout(timeout);
        reconnect.close();
        resolve();
      }
      if (msg.type === "error") {
        clearTimeout(timeout);
        reconnect.close();
        reject(new Error(`reconnect_error:${msg.code}`));
      }
    });
  });

  cleanup();
}

async function runPassphraseFlow() {
  const url = `ws://localhost:${PORT}`;
  const sender = new WebSocket(url);
  const receiverBad = new WebSocket(url);
  const receiverGood = new WebSocket(url);

  let code = "";

  const closeAll = () => {
    sender.close();
    receiverBad.close();
    receiverGood.close();
  };

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      closeAll();
      reject(new Error("passphrase_flow_timeout"));
    }, 10_000);

    let badRejected = false;
    let goodJoined = false;

    sender.on("message", (raw) => {
      const msg = JSON.parse(String(raw));
      if (msg.type === "connected") {
        sender.send(JSON.stringify({ type: "create_session", passphrase: "secret-123" }));
      }
      if (msg.type === "session_created") {
        if (!msg.requiresPassphrase) {
          clearTimeout(timeout);
          reject(new Error("passphrase_not_enforced"));
          return;
        }
        code = msg.code;
        receiverBad.send(JSON.stringify({ type: "join_session", code, passphrase: "wrong-pass" }));
      }
      if (msg.type === "error") {
        clearTimeout(timeout);
        reject(new Error(`sender_error:${msg.code}`));
      }
    });

    receiverBad.on("message", (raw) => {
      const msg = JSON.parse(String(raw));
      if (msg.type === "error" && msg.code === "invalid_passphrase") {
        badRejected = true;
        receiverGood.send(JSON.stringify({ type: "join_session", code, passphrase: "secret-123" }));
      }
    });

    receiverGood.on("message", (raw) => {
      const msg = JSON.parse(String(raw));
      if (msg.type === "session_joined") {
        goodJoined = true;
        if (!msg.requiresPassphrase) {
          clearTimeout(timeout);
          reject(new Error("passphrase_flag_missing_on_join"));
          return;
        }
      }
      if (msg.type === "error") {
        clearTimeout(timeout);
        reject(new Error(`good_receiver_error:${msg.code}`));
      }

      if (badRejected && goodJoined) {
        clearTimeout(timeout);
        resolve();
      }
    });
  });

  closeAll();
}

async function runJoinAuthFlow() {
  const url = `ws://localhost:${PORT}`;
  const sender = new WebSocket(url);
  const receiverMissing = new WebSocket(url);
  const receiverWrong = new WebSocket(url);
  const receiverGood = new WebSocket(url);

  let code = "";

  const closeAll = () => {
    sender.close();
    receiverMissing.close();
    receiverWrong.close();
    receiverGood.close();
  };

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      closeAll();
      reject(new Error("join_auth_flow_timeout"));
    }, 12_000);

    let missingRejected = false;
    let wrongRejected = false;
    let goodJoined = false;

    sender.on("message", (raw) => {
      const msg = JSON.parse(String(raw));
      if (msg.type === "connected") {
        sender.send(
          JSON.stringify({
            type: "create_session",
            joinAuth: {
              username: "demo-user",
              password: "demo-pass"
            }
          })
        );
      }
      if (msg.type === "session_created") {
        if (!msg.requiresJoinAuth) {
          clearTimeout(timeout);
          reject(new Error("join_auth_not_enforced"));
          return;
        }
        code = msg.code;
        receiverMissing.send(JSON.stringify({ type: "join_session", code }));
      }
      if (msg.type === "error") {
        clearTimeout(timeout);
        reject(new Error(`sender_error:${msg.code}`));
      }
    });

    receiverMissing.on("message", (raw) => {
      const msg = JSON.parse(String(raw));
      if (msg.type === "error" && msg.code === "join_auth_required") {
        missingRejected = true;
        receiverWrong.send(
          JSON.stringify({
            type: "join_session",
            code,
            joinAuth: {
              username: "demo-user",
              password: "bad-pass"
            }
          })
        );
      }
    });

    receiverWrong.on("message", (raw) => {
      const msg = JSON.parse(String(raw));
      if (msg.type === "error" && msg.code === "invalid_join_auth") {
        wrongRejected = true;
        receiverGood.send(
          JSON.stringify({
            type: "join_session",
            code,
            joinAuth: {
              username: "demo-user",
              password: "demo-pass"
            }
          })
        );
      }
    });

    receiverGood.on("message", (raw) => {
      const msg = JSON.parse(String(raw));
      if (msg.type === "session_joined") {
        goodJoined = true;
        if (!msg.requiresJoinAuth) {
          clearTimeout(timeout);
          reject(new Error("join_auth_flag_missing_on_join"));
          return;
        }
      }
      if (msg.type === "error") {
        clearTimeout(timeout);
        reject(new Error(`good_receiver_error:${msg.code}`));
      }

      if (missingRejected && wrongRejected && goodJoined) {
        clearTimeout(timeout);
        resolve();
      }
    });
  });

  closeAll();
}

async function main() {
  const child = spawn("node", ["apps/signaling-server/src/server.js"], {
    env: { ...process.env, PORT: String(PORT) },
    stdio: ["ignore", "pipe", "pipe"],
    cwd: process.cwd(),
    shell: false
  });

  child.stdout.on("data", (chunk) => {
    process.stdout.write(String(chunk));
  });

  child.stderr.on("data", (chunk) => {
    process.stderr.write(String(chunk));
  });

  let exitCode = 0;

  try {
    await wait(1800);
    const health = await getJson("/health");
    if (health.status !== "ok") {
      throw new Error("health_failed");
    }

    const config = await getJson("/config");
    if (!Array.isArray(config.iceServers) || config.iceServers.length === 0) {
      throw new Error("config_missing_ice");
    }

    await runWsFlow();
    await runPassphraseFlow();
    await runJoinAuthFlow();

    const metrics = await getJson("/metrics");
    if (typeof metrics.signalRelays !== "number") {
      throw new Error("metrics_invalid");
    }
    if (typeof metrics.passphraseProtectedSessions !== "number") {
      throw new Error("metrics_missing_passphrase_counter");
    }

    console.log("SMOKE PASS");
  } catch (error) {
    exitCode = 1;
    console.error("SMOKE FAIL", error.message);
  } finally {
    child.kill("SIGTERM");
    const exited = await new Promise((resolve) => {
      const timer = setTimeout(() => resolve(false), 2000);
      child.once("exit", () => {
        clearTimeout(timer);
        resolve(true);
      });
    });
    if (!exited) {
      child.kill("SIGKILL");
    }
    process.exit(exitCode);
  }
}

main();

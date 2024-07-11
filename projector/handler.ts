import { Socket as TCPSocket } from "net";
import { RemoteInfo, Socket as UDPSocket } from "dgram";

const discoveryMessageString =
  "00000001000000454241463637414100000000000000000000000000000000000000000000000001000c00000100020c0000004146363741410000000000000000000000000000000000000000";
const discoveryMessageBuffer = Buffer.from(discoveryMessageString, "hex");

const dataMessageString =
  "000000414636374141000000000000000000000000000000000000000000ba000001040c000000020650423030000003068007b0040000040602008007b00405580709080000000800080080004000e001380400000000070b080000000800080010001000e001380400000000070d080000000800080010001000e0013804000000000000080000000800080010001000e001380400000000070a0100010c022d0000000008089f06f0dd000000000a0a002f0202320401000000000b0b00010a0b09070c02131415160d0a000104401f0000000000000e010005";
const dataMessageBuffer = Buffer.from(dataMessageString, "hex");

const bufferToIP = (buffer: Buffer) => {
  return `${buffer[0]}.${buffer[1]}.${buffer[2]}.${buffer[3]}`;
};

const decodeHeader = (messageBuffer: Buffer) => {
  const controlWord = messageBuffer.subarray(0, 8).toString("ascii");
  const clientIp = messageBuffer.subarray(8, 12);
  const status = messageBuffer[12];
  const payloadLength = messageBuffer.subarray(13, 17).readUInt32BE();

  return {
    controlWord,
    clientIp,
    status,
    payloadLength,
  };
};

const createHeader = (
  controlWord: Buffer,
  clientIp: Buffer,
  status: number,
  payloadLength: number
) => {
  const statusBuffer = Buffer.alloc(1);
  statusBuffer.writeUInt8(status, 0);
  const payloadLengthBuffer = Buffer.alloc(4);
  payloadLengthBuffer.writeUInt32BE(payloadLength, 0);

  return Buffer.concat([
    controlWord,
    clientIp,
    statusBuffer,
    payloadLengthBuffer,
  ]);
};

export function handleMainServerConnection(socket: TCPSocket) {
  console.log("\n\n---Start Main Server Connection---");

  socket.on("data", (data) => {
    const header = decodeHeader(data);
    console.log(header);
    if (header.status === 2) {
      const header = createHeader(
        Buffer.from("EEMP0100"),
        data.subarray(8, 12),
        3,
        74
      );

      const fullMessage = Buffer.concat([header, discoveryMessageBuffer]);

      socket.write(fullMessage);

      setTimeout(() => {
        const header = createHeader(
          Buffer.from("EEMP0100"),
          data.subarray(8, 12),
          21,
          216
        );

        const fullMessage = Buffer.concat([header, dataMessageBuffer]);

        socket.write(fullMessage);
      }, 500);
    }
  });

  socket.on("close", () => {
    console.log("---End Main Server Connection---");
  });
}
export function handleImageServerConnection(socket: TCPSocket) {
  console.log("\n\n---Start Image Server Connection---");

  socket.on("data", (data) => {
    console.log("Received data from image server");
    const header = decodeHeader(data);
    console.log(header);
  });

  socket.on("close", () => {
    console.log("---End Image Server Connection---");
  });
}

export function handleDiscoveryServerConnection(
  msg: Buffer,
  rinfo: RemoteInfo,
  send: (
    msg: string | Uint8Array | readonly any[],
    port?: number,
    address?: string,
    callback?: (error: Error | null, bytes: number) => void
  ) => void
) {
  const receivedHeader = decodeHeader(msg);
  console.log("\n\n---Start Discovery Server Connection---");
  console.log(msg.toString("hex"));
  console.log(receivedHeader);
  const header = createHeader(
    Buffer.from("EEMP0100"),
    msg.subarray(8, 12),
    2,
    74
  );

  const fullMessage = Buffer.concat([header, discoveryMessageBuffer]);

  send(fullMessage, 3620, rinfo.address, (err) => {
    if (err) {
      console.error("Error sending message:", err);
    } else {
      console.log(`Message sent to ${rinfo.address}:3620`);
    }
  });

  const header2 = createHeader(
    Buffer.from("EEMP0100"),
    msg.subarray(8, 12),
    21,
    216
  );

  const fullMessage2 = Buffer.concat([header2, dataMessageBuffer]);

  send(fullMessage2, 3620, rinfo.address, (err) => {
    if (err) {
      console.error("Error sending message:", err);
    } else {
      console.log(`Message sent to ${rinfo.address}:3620`);
    }
  });

  console.log("---End Discovery Server Connection---");
}

const mqtt = require('mqtt');
const readline = require('readline');

const DEVICE_ID = 'player-001';
const BROKER_URL = 'mqtt://localhost:1883';

const client = mqtt.connect(BROKER_URL, {
  clientId: `publisher-${Date.now()}`,
  clean: true,
  reconnectPeriod: 3000,
});

const TOPIC = `players/${DEVICE_ID}/commands`;
const EVENTS_TOPIC = `players/${DEVICE_ID}/events`;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let correlationCounter = 1;

const generateCorrelationId = () => `corr-${String(correlationCounter++).padStart(3, '0')}`;

const publish = (command, extraPayload = {}) => {
  const message = {
    command,
    correlationId: generateCorrelationId(),
    timestamp: Date.now(),
    ...extraPayload,
  };

  client.publish(TOPIC, JSON.stringify(message), { qos: 1 }, (err) => {
    if (err) {
      console.error('❌ Failed to publish:', err.message);
    } else {
      console.log(`\n✅ Published: ${command}`);
      console.log('   Payload:', JSON.stringify(message, null, 2));
    }
    showMenu();
  });
};

const askVolume = () => {
  rl.question('Enter volume level (0-100): ', (val) => {
    const volume = parseInt(val);
    if (isNaN(volume) || volume < 0 || volume > 100) {
      console.log('❌ Invalid volume. Enter a number between 0 and 100.');
      askVolume();
      return;
    }
    publish('set_volume', { payload: { volume } });
  });
};

const showMenu = () => {
  console.log('\n─────────────────────────────────');
  console.log('MQTT Command Publisher for Signage Player');
  console.log(`   Device  : ${DEVICE_ID}`);
  console.log(`   Topic   : ${TOPIC}`);
  console.log('─────────────────────────────────');
  console.log('  [1] reload_playlist');
  console.log('  [2] play');
  console.log('  [3] pause');
  console.log('  [4] set_volume');
  console.log('  [5] screenshot');
  console.log('  [6] restart_player');
  console.log('  [0] exit');
  console.log('─────────────────────────────────');

  rl.question('Select command: ', (input) => {
    switch (input.trim()) {
      case '1':
        publish('reload_playlist');
        break;
      case '2':
        publish('play');
        break;
      case '3':
        publish('pause');
        break;
      case '4':
        askVolume();
        break;
      case '5':
        publish('screenshot');
        break;
      case '6':
        publish('restart_player');
        break;
      case '0':
        console.log('\nExiting...');
        client.end();
        rl.close();
        process.exit(0);
        break;
      default:
        console.log('Invalid option. Please try again.');
        showMenu();
    }
  });
};

client.on('connect', () => {
  console.log('✅ Connected to broker:', BROKER_URL);

  // Player'ın event response'larını da dinle
  client.subscribe(EVENTS_TOPIC, { qos: 1 }, (err) => {
    if (!err) {
      console.log('👂 Listening for events on:', EVENTS_TOPIC);
    }
  });

  showMenu();
});

client.on('message', (topic, message) => {
  try {
    const parsed = JSON.parse(message.toString());
    console.log('\n📨 Event received from player:');
    console.log(JSON.stringify(parsed, null, 2));
  } catch {
    console.log('\n📨 Raw message:', message.toString());
  }
});

client.on('error', (err) => {
  console.error('❌ Connection error:', err.message);
});

client.on('close', () => {
  console.log('🔌 Connection closed.');
});

client.on('reconnect', () => {
  console.log('🔄 Attempting to reconnect...');
});
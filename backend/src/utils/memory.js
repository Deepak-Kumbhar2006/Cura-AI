const userMemory = {};

function saveMessage(userId, message) {
    if (!userMemory[userId]) {
        userMemory[userId] = [];
    }

    userMemory[userId].push(message);

    // keep last 5 messages
    if (userMemory[userId].length > 5) {
        userMemory[userId].shift();
    }
}

function getHistory(userId) {
    return userMemory[userId] || [];
}

module.exports = { saveMessage, getHistory };
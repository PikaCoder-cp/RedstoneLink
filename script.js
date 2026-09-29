// ========================================
// REDSTONELINK WEBSITE
// ========================================


// Your backend server

const SERVER_URL =
    "ws://localhost:3000";


// ========================================
// VARIABLES
// ========================================

let socket = null;

let minecraftConnections = [];

let selectedMinecraft = null;


// ========================================
// HTML
// ========================================

const connectionStatus =
    document.getElementById(
        "connectionStatus"
    );

const minecraftStatus =
    document.getElementById(
        "minecraftStatus"
    );

const minecraftList =
    document.getElementById(
        "minecraftList"
    );

const activateButton =
    document.getElementById(
        "activateButton"
    );

const logElement =
    document.getElementById(
        "log"
    );


// ========================================
// LOG
// ========================================

function log(message) {

    const line =
        document.createElement(
            "div"
        );

    line.textContent =
        `[${new Date().toLocaleTimeString()}] ${message}`;

    logElement.appendChild(
        line
    );
}


// ========================================
// CONNECT
// ========================================

function connect() {

    log(
        "Connecting to RedstoneLink..."
    );


    socket = new WebSocket(
        SERVER_URL +
        "?type=website"
    );


    // Connected

    socket.onopen = () => {

        connectionStatus.textContent =
            "🟢 Connected";

        connectionStatus.className =
            "status connected";


        log(
            "Connected to server."
        );
    };


    // Disconnected

    socket.onclose = () => {

        connectionStatus.textContent =
            "🔴 Disconnected";

        connectionStatus.className =
            "status disconnected";


        activateButton.disabled =
            true;


        log(
            "Disconnected. Retrying..."
        );


        setTimeout(
            connect,
            2000
        );
    };


    // Error

    socket.onerror = () => {

        log(
            "WebSocket error."
        );
    };


    // Message

    socket.onmessage = event => {

        let data;

        try {

            data =
                JSON.parse(
                    event.data
                );

        } catch {

            log(
                "Invalid server message."
            );

            return;
        }


        handleMessage(
            data
        );
    };
}


// ========================================
// HANDLE MESSAGE
// ========================================

function handleMessage(data) {


    // Minecraft count

    if (
        data.type ===
        "minecraft_count"
    ) {

        updateMinecraftStatus();

        return;
    }


    // Minecraft connected

    if (
        data.type ===
        "minecraft_connected"
    ) {

        if (
            !minecraftConnections.includes(
                data.minecraftId
            )
        ) {

            minecraftConnections.push(
                data.minecraftId
            );
        }


        log(
            "Minecraft connected."
        );


        updateMinecraftList();

        updateMinecraftStatus();

        return;
    }


    // Minecraft disconnected

    if (
        data.type ===
        "minecraft_disconnected"
    ) {

        minecraftConnections =
            minecraftConnections.filter(
                id =>
                    id !==
                    data.minecraftId
            );


        if (
            selectedMinecraft ===
            data.minecraftId
        ) {

            selectedMinecraft =
                null;

            activateButton.disabled =
                true;
        }


        log(
            "Minecraft disconnected."
        );


        updateMinecraftList();

        updateMinecraftStatus();

        return;
    }


    // Block registered

    if (
        data.type ===
        "block_registered"
    ) {

        log(
            `Block registered: ${data.blockId}`
        );

        return;
    }


    // Redstone activated

    if (
        data.type ===
        "redstone_activated"
    ) {

        log(
            `Redstone activated: ${data.blockId}`
        );

        return;
    }


    // Error

    if (
        data.type ===
        "error"
    ) {

        log(
            `ERROR: ${data.message}`
        );

        return;
    }
}


// ========================================
// MINECRAFT STATUS
// ========================================

function updateMinecraftStatus() {

    if (
        minecraftConnections.length ===
        0
    ) {

        minecraftStatus.textContent =
            "🔴 No Minecraft worlds connected.";

        return;
    }


    minecraftStatus.textContent =
        `🟢 ${minecraftConnections.length} Minecraft world(s) connected.`;
}


// ========================================
// MINECRAFT LIST
// ========================================

function updateMinecraftList() {

    minecraftList.innerHTML = "";


    for (
        const minecraftId
        of minecraftConnections
    ) {

        const button =
            document.createElement(
                "button"
            );


        button.textContent =
            `Minecraft ${minecraftId.substring(0, 8)}`;


        button.className =
            "minecraftButton";


        button.onclick = () => {

            selectMinecraft(
                minecraftId
            );
        };


        if (
            selectedMinecraft ===
            minecraftId
        ) {

            button.classList.add(
                "selected"
            );
        }


        minecraftList.appendChild(
            button
        );
    }
}


// ========================================
// SELECT MINECRAFT
// ========================================

function selectMinecraft(
    minecraftId
) {

    selectedMinecraft =
        minecraftId;


    activateButton.disabled =
        false;


    log(
        "Minecraft world selected."
    );


    updateMinecraftList();
}


// ========================================
// ACTIVATE REDSTONE
// ========================================

function activateRedstone() {

    if (
        !socket ||
        socket.readyState !==
        WebSocket.OPEN
    ) {

        alert(
            "The website isn't connected."
        );

        return;
    }


    if (!selectedMinecraft) {

        alert(
            "Select a Minecraft world first."
        );

        return;
    }


    socket.send(
        JSON.stringify({

            type:
                "activate",

            minecraftId:
                selectedMinecraft,

            blockId:
                "test"

        })
    );


    log(
        "Redstone activation sent."
    );
}


// ========================================
// START
// ========================================

connect();

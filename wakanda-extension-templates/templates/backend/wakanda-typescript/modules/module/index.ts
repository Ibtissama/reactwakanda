function logMessage(type, message){
    console.log("[" + type + "] - " + (new Date()) + " - " + message );    
}

export function error(message){
    logMessage("ERROR", message);
};

export function info(message){
    logMessage("INFO", message);
};
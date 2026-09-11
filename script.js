"use strict";

// ======================================================
// AI RECEPTIONIST - COMPLETE VERSION
// ======================================================

const API_URL = window.location.origin;

let recognition = null;
let listening = false;

let aiMode = null;

let aiData = {
    name: "",
    phone: "",
    person: "",
    purpose: "",
    date: "",
    time: ""
};

let waitingForConfirmation = false;


// ======================================================
// GET ELEMENT
// ======================================================

function get(id) {
    return document.getElementById(id);
}


// ======================================================
// START
// ======================================================

document.addEventListener("DOMContentLoaded", function () {

    console.log("AI Receptionist frontend loaded.");

    const elements = [
        "sendButton",
        "userInput",
        "talkAIButton",
        "appointmentButton",
        "visitorButton",
        "registerVisitorButton",
        "cancelVisitorButton",
        "bookAppointmentButton",
        "cancelAppointmentButton",
        "speakButton",
        "checkServerButton"
    ];

    elements.forEach(function (id) {
        if (!get(id)) {
            console.error("Missing HTML element:", id);
        }
    });


    if (get("sendButton")) {
        get("sendButton").addEventListener(
            "click",
            sendMessage
        );
    }


    if (get("userInput")) {
        get("userInput").addEventListener(
            "keydown",
            function (event) {

                if (event.key === "Enter") {

                    event.preventDefault();

                    sendMessage();

                }

            }
        );
    }


    if (get("talkAIButton")) {
        get("talkAIButton").addEventListener(
            "click",
            talkToAI
        );
    }


    if (get("appointmentButton")) {
        get("appointmentButton").addEventListener(
            "click",
            showAppointmentForm
        );
    }


    if (get("visitorButton")) {
        get("visitorButton").addEventListener(
            "click",
            showVisitorForm
        );
    }


    if (get("registerVisitorButton")) {
        get("registerVisitorButton").addEventListener(
            "click",
            registerVisitor
        );
    }


    if (get("cancelVisitorButton")) {
        get("cancelVisitorButton").addEventListener(
            "click",
            closeVisitorForm
        );
    }


    if (get("bookAppointmentButton")) {
        get("bookAppointmentButton").addEventListener(
            "click",
            bookAppointment
        );
    }


    if (get("cancelAppointmentButton")) {
        get("cancelAppointmentButton").addEventListener(
            "click",
            closeAppointmentForm
        );
    }


    if (get("speakButton")) {
        get("speakButton").addEventListener(
            "click",
            startVoiceInput
        );
    }


    if (get("checkServerButton")) {
        get("checkServerButton").addEventListener(
            "click",
            checkServer
        );
    }


    // Check backend
    checkServer();

});


// ======================================================
// MESSAGE
// ======================================================

function addMessage(text, type) {

    const chat = get("chatBox");

    if (!chat) {
        console.error("chatBox not found.");
        return;
    }

    const message = document.createElement("div");

    message.className = "message " + type;

    message.textContent = text;

    chat.appendChild(message);

    chat.scrollTop = chat.scrollHeight;

}


// ======================================================
// SEND MESSAGE
// ======================================================

function sendMessage() {

    const input = get("userInput");

    if (!input) {
        return;
    }

    const text = input.value.trim();

    if (!text) {
        return;
    }

    addMessage(
        text,
        "user-message"
    );

    input.value = "";

    processAI(text);

}


// ======================================================
// MAIN AI
// ======================================================

function processAI(text) {

    const lower = text.toLowerCase().trim();


    // ==================================================
    // CONFIRMATION
    // ==================================================

    if (waitingForConfirmation) {

        if (isYes(lower)) {

            waitingForConfirmation = false;

            finishAIRequest();

            return;
        }


        if (isNo(lower)) {

            resetAI();

            respond(
                "No problem. I have cancelled that request. How else can I help you?"
            );

            return;
        }


        respond(
            "Please say yes to confirm or no to cancel."
        );

        return;
    }


    // ==================================================
    // CANCEL
    // ==================================================

    if (
        lower.includes("cancel") &&
        aiMode
    ) {

        resetAI();

        respond(
            "No problem. I cancelled the current request."
        );

        return;
    }


    // ==================================================
    // APPOINTMENT DETECTION
    // ==================================================

    if (
        lower.includes("appointment") ||
        lower.includes("book") ||
        lower.includes("schedule") ||
        lower.includes("meeting") ||
        lower.includes("meet")
    ) {

        aiMode = "appointment";

    }


    // ==================================================
    // VISITOR DETECTION
    // ==================================================

    if (
        lower.includes("visitor") ||
        lower.includes("register my visit") ||
        lower.includes("register visitor") ||
        lower.includes("visit")
    ) {

        aiMode = "visitor";

    }


    // ==================================================
    // EXTRACT INFORMATION
    // ==================================================

    extractInformation(text);


    // ==================================================
    // NORMAL CONVERSATION
    // ==================================================

    if (!aiMode) {

        respond(
            normalResponse(lower)
        );

        return;
    }


    // ==================================================
    // ASK MISSING
    // ==================================================

    askMissing();

}


// ======================================================
// NORMAL RESPONSE
// ======================================================

function normalResponse(text) {

    if (
        text === "hi" ||
        text === "hello" ||
        text === "hey" ||
        text.startsWith("hi ") ||
        text.startsWith("hello ")
    ) {

        return (
            "Hello! 👋 Welcome to our AI Receptionist. " +
            "How can I help you today?"
        );

    }


    if (
        text.includes("timing") ||
        text.includes("hours") ||
        text.includes("working time") ||
        text.includes("open")
    ) {

        return (
            "Our office working hours are 9 AM to 6 PM, Monday to Saturday."
        );

    }


    if (
        text.includes("location") ||
        text.includes("address") ||
        text.includes("where are you")
    ) {

        return (
            "Please visit the main reception desk at the office entrance."
        );

    }


    if (
        text.includes("thank")
    ) {

        return (
            "You're welcome! 😊"
        );

    }


    if (
        text.includes("help")
    ) {

        return (
            "I can help you book an appointment, register a visitor, " +
            "check office timings, or answer basic reception questions."
        );

    }


    return (
        "I can help you book an appointment, register a visitor, " +
        "or answer basic reception questions."
    );

}


// ======================================================
// RESPOND
// ======================================================

function respond(text) {

    addMessage(
        text,
        "bot-message"
    );

    speak(text);

}


// ======================================================
// TALK AI
// ======================================================

function talkToAI() {

    respond(
        "I'm ready. Tell me what you need, or click Speak and talk to me."
    );

}


// ======================================================
// SHOW VISITOR FORM
// ======================================================

function showVisitorForm() {

    closeAppointmentForm();

    if (!get("visitorForm")) {
        return;
    }

    get("visitorForm").style.display = "block";

    if (get("visitorName")) {
        get("visitorName").focus();
    }

}


// ======================================================
// CLOSE VISITOR FORM
// ======================================================

function closeVisitorForm() {

    if (get("visitorForm")) {
        get("visitorForm").style.display = "none";
    }

}


// ======================================================
// REGISTER VISITOR
// ======================================================

async function registerVisitor() {

    const name =
        get("visitorName").value.trim();

    const phone =
        get("visitorPhone").value.trim();

    const purpose =
        get("visitorPurpose").value.trim();

    const person =
        get("personToMeet").value.trim();


    if (!name) {
        alert("Please enter your name.");
        return;
    }


    if (!phone) {
        alert("Please enter your phone number.");
        return;
    }


    if (!purpose) {
        alert("Please enter the purpose.");
        return;
    }


    if (!person) {
        alert("Please enter the person you want to meet.");
        return;
    }


    try {

        const response = await fetch(
            API_URL + "/api/visitors",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    name,
                    phone,
                    purpose,
                    person
                })
            }
        );


        const data = await response.json();


        if (
            response.ok &&
            data.success
        ) {

            alert(
                "✅ Visitor registered successfully!"
            );


            get("visitorName").value = "";
            get("visitorPhone").value = "";
            get("visitorPurpose").value = "";
            get("personToMeet").value = "";


            closeVisitorForm();


            respond(
                "Your visitor registration has been completed successfully."
            );

        } else {

            alert(
                data.message ||
                "Visitor registration failed."
            );

        }

    } catch (error) {

        console.error(
            "Visitor registration error:",
            error
        );

        alert(
            "❌ Backend connection failed."
        );

    }

}


// ======================================================
// SHOW APPOINTMENT FORM
// ======================================================

function showAppointmentForm() {

    closeVisitorForm();

    if (!get("appointmentForm")) {
        return;
    }

    get("appointmentForm").style.display = "block";

    if (get("appointmentName")) {
        get("appointmentName").focus();
    }

}


// ======================================================
// CLOSE APPOINTMENT FORM
// ======================================================

function closeAppointmentForm() {

    if (get("appointmentForm")) {
        get("appointmentForm").style.display = "none";
    }

}


// ======================================================
// BOOK APPOINTMENT
// ======================================================

async function bookAppointment() {

    const name =
        get("appointmentName").value.trim();

    const phone =
        get("appointmentPhone").value.trim();

    const person =
        get("appointmentPerson").value.trim();

    const purpose =
        get("appointmentPurpose").value.trim();

    const date =
        get("appointmentDate").value;

    const time =
        get("appointmentTime").value;


    if (!name) {

        alert("Please enter your name.");

        get("appointmentName").focus();

        return;
    }


    if (!person) {

        alert(
            "Please enter the person you want to meet."
        );

        get("appointmentPerson").focus();

        return;
    }


    if (!date) {

        alert(
            "Please select an appointment date."
        );

        get("appointmentDate").focus();

        return;
    }


    if (!time) {

        alert(
            "Please select an appointment time."
        );

        get("appointmentTime").focus();

        return;
    }


    const button =
        get("bookAppointmentButton");

    button.disabled = true;

    button.textContent = "Booking...";


    try {

        const response = await fetch(
            API_URL + "/api/appointments",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    name,
                    phone,
                    person,
                    purpose,
                    date,
                    time

                })
            }
        );


        const responseText =
            await response.text();


        console.log(
            "Server response:",
            response.status,
            responseText
        );


        let data = null;


        if (responseText.trim()) {

            try {

                data =
                    JSON.parse(responseText);

            } catch (error) {

                console.error(
                    "Invalid JSON:",
                    error
                );

            }

        }


        if (
            response.ok &&
            data &&
            data.success
        ) {

            alert(
                "✅ Appointment booked successfully!"
            );


            get("appointmentName").value = "";
            get("appointmentPhone").value = "";
            get("appointmentPerson").value = "";
            get("appointmentPurpose").value = "";
            get("appointmentDate").value = "";
            get("appointmentTime").value = "";


            closeAppointmentForm();


            respond(
                "Your appointment has been booked successfully. We look forward to seeing you!"
            );


            return;
        }


        if (data && data.message) {

            alert(
                "❌ " + data.message
            );

        } else {

            alert(
                "❌ Server error. HTTP status: " +
                response.status
            );

        }


    } catch (error) {

        console.error(
            "Appointment request error:",
            error
        );


        alert(
            "❌ Cannot connect to the backend. " +
            "Make sure server2.js is running."
        );

    } finally {

        button.disabled = false;

        button.textContent =
            "Book Appointment";

    }

}


// ======================================================
// VOICE INPUT
// ======================================================

function startVoiceInput() {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    if (!SpeechRecognition) {

        alert(
            "Please use Google Chrome for voice input."
        );

        return;

    }


    if (listening) {

        recognition.stop();

        return;

    }


    recognition =
        new SpeechRecognition();


    recognition.lang =
        "en-IN";


    recognition.continuous =
        false;


    recognition.interimResults =
        false;


    recognition.onstart =
        function () {

            listening = true;


            if (get("speakButton")) {
                get("speakButton").textContent =
                    "🛑 Stop";
            }


            if (get("voiceStatus")) {
                get("voiceStatus").textContent =
                    "🎤 Listening...";
            }

        };


    recognition.onresult =
        function (event) {

            const text =
                event.results[0][0]
                    .transcript;


            if (get("voiceStatus")) {

                get("voiceStatus").textContent =
                    "✅ Heard: " + text;

            }


            addMessage(
                text,
                "user-message"
            );


            processAI(text);

        };


    recognition.onerror =
        function (event) {

            console.error(
                "Voice error:",
                event.error
            );


            if (get("voiceStatus")) {

                get("voiceStatus").textContent =
                    "❌ Voice error: " +
                    event.error;

            }

        };


    recognition.onend =
        function () {

            listening = false;


            if (get("speakButton")) {

                get("speakButton").textContent =
                    "🎤 Speak";

            }


            setTimeout(
                function () {

                    if (get("voiceStatus")) {

                        get("voiceStatus").textContent =
                            "Click Speak and talk to the receptionist.";

                    }

                },
                1000
            );

        };


    recognition.start();

}


// ======================================================
// SPEECH OUTPUT
// ======================================================

function speak(text) {

    if (!window.speechSynthesis) {
        return;
    }


    window.speechSynthesis.cancel();


    const clean =
        text.replace(
            /[\u{1F300}-\u{1FAFF}]/gu,
            ""
        );


    const utterance =
        new SpeechSynthesisUtterance(
            clean
        );


    utterance.lang =
        "en-IN";


    utterance.rate =
        1;


    utterance.pitch =
        1;


    window.speechSynthesis.speak(
        utterance
    );

}


// ======================================================
// EXTRACT INFORMATION
// ======================================================

function extractInformation(text) {

    let match;

    // ==================================================
    // NAME
    // ==================================================

    match = text.match(
        /my name is\s+(.+?)(?:,|\.| and |$)/i
    );

    if (!match) {
        match = text.match(
            /i am\s+(.+?)(?:,|\.| and |$)/i
        );
    }

    if (match) {
        aiData.name = cleanName(match[1]);
    }


    // ==================================================
    // PERSON TO MEET
    // ==================================================

    match = text.match(
        /(?:want to|would like to|need to|going to)?\s*meet\s+(?:with\s+)?(.+?)(?:,|\.| on | at | tomorrow| today|$)/i
    );

    if (match) {
        aiData.person = cleanPerson(match[1]);
    }


    // ==================================================
    // PHONE NUMBER
    // ==================================================

    match = text.match(
        /(?:phone|mobile|number|contact)[^\d]*(\d[\d\s-]{7,})/i
    );

    if (match) {

        aiData.phone = match[1]
            .replace(/\D/g, "")
            .slice(-10);

    }


    // ==================================================
    // PURPOSE
    // ==================================================

    match = text.match(
        /purpose(?: of visit)?\s*(?:is|:)?\s*(.+?)(?:\.|$)/i
    );

    if (match) {
        aiData.purpose = match[1].trim();
    }


    // ==================================================
    // DATE
    // ==================================================

    const lower = text.toLowerCase();

    if (lower.includes("tomorrow")) {

        const date = new Date();

        date.setDate(
            date.getDate() + 1
        );

        aiData.date = formatDate(date);

    }

    else if (lower.includes("today")) {

        aiData.date =
            formatDate(new Date());

    }

    else {

        match = text.match(
            /(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/
        );

        if (match) {

            let day = Number(match[1]);

            let month = Number(match[2]);

            let year = match[3]
                ? Number(match[3])
                : new Date().getFullYear();

            if (year < 100) {
                year += 2000;
            }

            const date = new Date(
                year,
                month - 1,
                day
            );

            if (!isNaN(date.getTime())) {

                aiData.date =
                    formatDate(date);

            }

        }

    }


    // ==================================================
    // TIME
    // ==================================================

    match = text.match(
        /(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i
    );

    if (match) {

        let hour =
            Number(match[1]);

        const minutes =
            match[2]
                ? match[2]
                : "00";

        const period =
            match[3].toLowerCase();

        if (
            period === "pm" &&
            hour !== 12
        ) {
            hour += 12;
        }

        if (
            period === "am" &&
            hour === 12
        ) {
            hour = 0;
        }

        aiData.time =
            String(hour).padStart(2, "0") +
            ":" +
            minutes;

    }

}


// ======================================================
// CLEAN NAME
// ======================================================

function cleanName(name) {

    return name
        .trim()
        .replace(/\s+/g, " ");

}


// ======================================================
// CLEAN PERSON
// ======================================================

function cleanPerson(person) {

    return person
        .trim()
        .replace(/\s+/g, " ");

}


// ======================================================
// FORMAT DATE
// ======================================================

function formatDate(date) {

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;

}


// ======================================================
// YES
// ======================================================

function isYes(text) {

    return [
        "yes",
        "yeah",
        "yep",
        "sure",
        "okay",
        "ok",
        "confirm",
        "confirmed",
        "correct"
    ].includes(text.trim());

}


// ======================================================
// NO
// ======================================================

function isNo(text) {

    return [
        "no",
        "nope",
        "cancel",
        "wrong"
    ].includes(text.trim());

}


// ======================================================
// RESET AI
// ======================================================

function resetAI() {

    aiMode = null;

    waitingForConfirmation = false;

    aiData = {
        name: "",
        phone: "",
        person: "",
        purpose: "",
        date: "",
        time: ""
    };

}


// ======================================================
// ASK MISSING INFORMATION
// ======================================================

function askMissing() {

    if (!aiData.name) {

        respond(
            "Sure. What is your name?"
        );

        return;
    }


    if (!aiData.phone) {

        respond(
            "What is your phone number?"
        );

        return;
    }


    if (!aiData.person) {

        respond(
            "Who would you like to meet?"
        );

        return;
    }


    if (!aiData.purpose) {

        respond(
            "What is the purpose of your visit?"
        );

        return;
    }


    if (
        aiMode === "appointment" &&
        !aiData.date
    ) {

        respond(
            "What date would you like the appointment?"
        );

        return;
    }


    if (
        aiMode === "appointment" &&
        !aiData.time
    ) {

        respond(
            "What time would you like the appointment?"
        );

        return;
    }


    // ==============================================
    // ALL INFORMATION AVAILABLE
    // ==============================================

    let message = "";

    if (aiMode === "appointment") {

        message =
            `Please confirm your appointment. ` +
            `Name: ${aiData.name}. ` +
            `Phone: ${aiData.phone}. ` +
            `Person: ${aiData.person}. ` +
            `Purpose: ${aiData.purpose}. ` +
            `Date: ${aiData.date}. ` +
            `Time: ${aiData.time}. ` +
            `Should I book it?`;

    }

    else {

        message =
            `Please confirm your visitor registration. ` +
            `Name: ${aiData.name}. ` +
            `Phone: ${aiData.phone}. ` +
            `Person: ${aiData.person}. ` +
            `Purpose: ${aiData.purpose}. ` +
            `Should I register you?`;

    }

    waitingForConfirmation = true;

    respond(message);

}


// ======================================================
// FINISH AI REQUEST
// ======================================================

async function finishAIRequest() {

    if (aiMode === "appointment") {

        try {

            const response =
                await fetch(
                    API_URL + "/api/appointments",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            name: aiData.name,

                            phone: aiData.phone,

                            person: aiData.person,

                            purpose: aiData.purpose,

                            date: aiData.date,

                            time: aiData.time

                        })

                    }
                );


            const data =
                await response.json();


            if (
                response.ok &&
                data.success
            ) {

                respond(
                    "✅ Your appointment has been booked successfully."
                );

                resetAI();

            }

            else {

                respond(
                    data.message ||
                    "Sorry, I could not book the appointment."
                );

            }

        }

        catch (error) {

            console.error(
                "Appointment error:",
                error
            );

            respond(
                "Sorry, I could not connect to the server."
            );

        }

        return;
    }


    // ==================================================
    // VISITOR
    // ==================================================

    if (aiMode === "visitor") {

        try {

            const response =
                await fetch(
                    API_URL + "/api/visitors",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            name: aiData.name,

                            phone: aiData.phone,

                            purpose: aiData.purpose,

                            person: aiData.person

                        })

                    }
                );


            const data =
                await response.json();


            if (
                response.ok &&
                data.success
            ) {

                respond(
                    "✅ Your visitor registration has been completed successfully."
                );

                resetAI();

            }

            else {

                respond(
                    data.message ||
                    "Sorry, I could not register your visit."
                );

            }

        }

        catch (error) {

            console.error(
                "Visitor error:",
                error
            );

            respond(
                "Sorry, I could not connect to the server."
            );

        }

    }

}


// ======================================================
// CHECK SERVER
// ======================================================

async function checkServer() {

    const status =
        get("serverStatus");


    if (!status) {
        return;
    }


    status.textContent =
        "Checking server...";


    try {

        const response =
            await fetch(
                API_URL + "/api/status"
            );


        const data =
            await response.json();


        if (
            response.ok &&
            data.success
        ) {

            status.textContent =
                "🟢 Server status: Connected";

        }

        else {

            status.textContent =
                "🔴 Server status: Error";

        }

    }

    catch (error) {

        console.error(
            "Server check error:",
            error
        );

        status.textContent =
            "🔴 Server status: Offline";

    }

}
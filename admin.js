"use strict";

/* ============================================================
   AI RECEPTIONIST - ADMIN.JS
   Complete Admin Dashboard + Voice Assistant Widget
   ============================================================ */

const API_URL = window.location.origin;

let visitors = [];
let appointments = [];

let voiceRecognition = null;
let voiceActive = false;
let voiceProcessing = false;

let bookingData = {};
let bookingStep = null;


/* ============================================================
   START
   ============================================================ */

document.addEventListener("DOMContentLoaded", function () {

    setupButtons();
    setupNavigation();
    setupForms();
    setupVoiceButtons();

    createVoiceWidget();

    loadDashboard();

});


/* ============================================================
   NAVIGATION
   ============================================================ */

function setupNavigation() {

    const buttons =
        document.querySelectorAll(
            ".nav-btn, .quick-btn"
        );

    buttons.forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                const section =
                    button.getAttribute(
                        "data-section"
                    );

                if (section) {
                    showSection(section);
                }

            }
        );

    });

}


function showSection(id) {

    document
        .querySelectorAll(".section")
        .forEach(function (section) {

            section.classList.remove("active");

        });


    document
        .querySelectorAll(".nav-btn")
        .forEach(function (button) {

            button.classList.remove("active");

        });


    const target =
        document.getElementById(id);


    if (target) {

        target.classList.add("active");

    }


    document
        .querySelectorAll(
            '.nav-btn[data-section="' + id + '"]'
        )
        .forEach(function (button) {

            button.classList.add("active");

        });

}


/* ============================================================
   BUTTONS
   ============================================================ */

function setupButtons() {

    const logoutButton =
        document.getElementById(
            "logoutBtn"
        );


    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            function () {

                stopVoiceAssistant();

                window.location.href =
                    "/login";

            }
        );

    }

}


/* ============================================================
   FORMS
   ============================================================ */

function setupForms() {

    const visitorForm =
        document.getElementById(
            "visitorForm"
        );


    if (visitorForm) {

        visitorForm.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();

                registerVisitor(
                    visitorForm
                );

            }
        );

    }


    const appointmentForm =
        document.getElementById(
            "appointmentForm"
        );


    if (appointmentForm) {

        appointmentForm.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();

                createAppointment(
                    appointmentForm
                );

            }
        );

    }

}


/* ============================================================
   DASHBOARD
   ============================================================ */

async function loadDashboard() {

    await checkSystemHealth();

    await loadVisitors();

    await loadAppointments();

    await loadStatistics();

}


/* ============================================================
   HEALTH
   ============================================================ */

async function checkSystemHealth() {

    const element =
        document.getElementById(
            "systemStatus"
        );


    if (!element) {
        return;
    }


    try {

        const response =
            await fetch(
                API_URL + "/api/health"
            );


        if (!response.ok) {
            throw new Error(
                "Server unavailable"
            );
        }


        element.textContent =
            "Online";

        element.classList.remove(
            "bad"
        );

        element.classList.add(
            "ok"
        );


    } catch (error) {

        console.error(error);

        element.textContent =
            "Offline";

        element.classList.remove(
            "ok"
        );

        element.classList.add(
            "bad"
        );

    }

}


/* ============================================================
   VISITORS
   ============================================================ */

async function loadVisitors() {

    try {

        const response =
            await fetch(
                API_URL + "/api/visitors"
            );


        if (!response.ok) {

            throw new Error(
                "Unable to load visitors."
            );

        }


        const data =
            await response.json();


        if (!data.success) {

            throw new Error(
                data.message ||
                "Unable to load visitors."
            );

        }


        visitors =
            Array.isArray(
                data.visitors
            )
                ? data.visitors
                : [];


        displayVisitors();


    } catch (error) {

        console.error(
            "Visitor loading error:",
            error
        );

        visitors = [];

        displayVisitors();

    }

}


/* ============================================================
   DISPLAY VISITORS
   ============================================================ */

function displayVisitors() {

    const body =
        document.getElementById(
            "visitorsTableBody"
        );


    const list =
        document.getElementById(
            "visitorList"
        );


    if (body) {

        body.innerHTML = "";


        if (visitors.length === 0) {

            body.innerHTML =
                '<tr><td colspan="6">No visitors found.</td></tr>';

        } else {

            visitors.forEach(
                function (visitor) {

                    const row =
                        document.createElement(
                            "tr"
                        );


                    row.innerHTML =
                        "<td>" +
                        escapeHTML(
                            visitor.name
                        ) +
                        "</td>" +

                        "<td>" +
                        escapeHTML(
                            visitor.phone || "-"
                        ) +
                        "</td>" +

                        "<td>" +
                        escapeHTML(
                            visitor.person || "-"
                        ) +
                        "</td>" +

                        "<td>" +
                        escapeHTML(
                            visitor.purpose || "-"
                        ) +
                        "</td>" +

                        "<td>" +
                        escapeHTML(
                            visitor.created_at || "-"
                        ) +
                        "</td>" +

                        "<td>" +
                        '<button type="button" onclick="deleteVisitor(' +
                        visitor.id +
                        ')">Delete</button>' +
                        "</td>";


                    body.appendChild(row);

                }
            );

        }

    }


    if (list) {

        list.innerHTML = "";


        if (visitors.length === 0) {

            list.innerHTML =
                "<p>No visitors found.</p>";

        } else {

            visitors.forEach(
                function (visitor) {

                    const card =
                        document.createElement(
                            "div"
                        );


                    card.className =
                        "item-card";


                    card.innerHTML =
                        "<h3>Visitor: " +
                        escapeHTML(
                            visitor.name
                        ) +
                        "</h3>" +

                        "<p><strong>Phone:</strong> " +
                        escapeHTML(
                            visitor.phone || "-"
                        ) +
                        "</p>" +

                        "<p><strong>Person:</strong> " +
                        escapeHTML(
                            visitor.person || "-"
                        ) +
                        "</p>" +

                        "<p><strong>Purpose:</strong> " +
                        escapeHTML(
                            visitor.purpose || "-"
                        ) +
                        "</p>" +

                        "<p><strong>Registered:</strong> " +
                        escapeHTML(
                            visitor.created_at || "-"
                        ) +
                        "</p>" +

                        '<button type="button" onclick="deleteVisitor(' +
                        visitor.id +
                        ')">Delete</button>';


                    list.appendChild(card);

                }
            );

        }

    }

}


/* ============================================================
   REGISTER VISITOR
   ============================================================ */

async function registerVisitor(form) {

    const formData =
        new FormData(form);


    const visitor = {

        name:
            String(
                formData.get("name") || ""
            ).trim(),

        phone:
            String(
                formData.get("phone") || ""
            ).trim(),

        person:
            String(
                formData.get("person") || ""
            ).trim(),

        purpose:
            String(
                formData.get("purpose") || ""
            ).trim()

    };


    if (!visitor.name) {

        showFormMessage(
            "visitorMessage",
            "Please enter visitor name.",
            true
        );

        return;

    }


    const result =
        await registerVisitorDirect(
            visitor
        );


    if (result.ok) {

        showFormMessage(
            "visitorMessage",
            "Visitor registered successfully!",
            false
        );


        form.reset();

    } else {

        showFormMessage(
            "visitorMessage",
            "Registration failed: " +
            result.message,
            true
        );

    }

}


/* ============================================================
   DIRECT VISITOR REGISTRATION
   ============================================================ */

async function registerVisitorDirect(
    visitorData
) {

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

                    body:
                        JSON.stringify(
                            visitorData
                        )
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                data.error ||
                "Visitor registration failed."
            );

        }


        await loadVisitors();

        await loadStatistics();


        return {
            ok: true
        };


    } catch (error) {

        console.error(error);


        return {
            ok: false,
            message: error.message
        };

    }

}


/* ============================================================
   DELETE VISITOR
   ============================================================ */

async function deleteVisitor(id) {

    if (
        !window.confirm(
            "Are you sure you want to delete this visitor?"
        )
    ) {

        return;

    }


    try {

        const response =
            await fetch(
                API_URL +
                "/api/visitors/" +
                id,
                {
                    method: "DELETE"
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Delete failed."
            );

        }


        await loadVisitors();

        await loadStatistics();


    } catch (error) {

        console.error(error);

        window.alert(
            "Unable to delete visitor."
        );

    }

}


/* ============================================================
   APPOINTMENTS
   ============================================================ */

async function loadAppointments() {

    try {

        const response =
            await fetch(
                API_URL +
                "/api/appointments"
            );


        if (!response.ok) {

            throw new Error(
                "Unable to load appointments."
            );

        }


        const data =
            await response.json();


        if (!data.success) {

            throw new Error(
                data.message ||
                "Unable to load appointments."
            );

        }


        appointments =
            Array.isArray(
                data.appointments
            )
                ? data.appointments
                : [];


        displayAppointments();


    } catch (error) {

        console.error(
            "Appointment loading error:",
            error
        );

        appointments = [];

        displayAppointments();

    }

}


/* ============================================================
   DISPLAY APPOINTMENTS
   ============================================================ */

function displayAppointments() {

    const body =
        document.getElementById(
            "appointmentsTableBody"
        );


    const list =
        document.getElementById(
            "appointmentList"
        );


    if (body) {

        body.innerHTML = "";


        if (
            appointments.length === 0
        ) {

            body.innerHTML =
                '<tr><td colspan="9">No appointments found.</td></tr>';

        } else {

            appointments.forEach(
                function (appointment) {

                    const row =
                        document.createElement(
                            "tr"
                        );


                    const source =
                        appointment.source === "voice"
                            ? "Voice"
                            : "Manual";


                    row.innerHTML =
                        "<td>" +
                        escapeHTML(
                            appointment.name
                        ) +
                        "</td>" +

                        "<td>" +
                        escapeHTML(
                            appointment.phone || "-"
                        ) +
                        "</td>" +

                        "<td>" +
                        escapeHTML(
                            appointment.person || "-"
                        ) +
                        "</td>" +

                        "<td>" +
                        escapeHTML(
                            appointment.date || "-"
                        ) +
                        "</td>" +

                        "<td>" +
                        escapeHTML(
                            appointment.time || "-"
                        ) +
                        "</td>" +

                        "<td>" +
                        escapeHTML(
                            appointment.purpose || "-"
                        ) +
                        "</td>" +

                        "<td>" +
                        source +
                        "</td>" +

                        "<td>" +

                        '<button type="button" onclick="deleteAppointment(' +

                        appointment.id +

                        ')">Cancel</button>' +

                        "</td>";


                    body.appendChild(row);

                }
            );

        }

    }


    if (list) {

        list.innerHTML = "";


        if (
            appointments.length === 0
        ) {

            list.innerHTML =
                "<p>No appointments found.</p>";

        } else {

            appointments.forEach(
                function (appointment) {

                    const card =
                        document.createElement(
                            "div"
                        );


                    card.className =
                        "item-card";


                    card.innerHTML =
                        "<h3>Appointment: " +

                        escapeHTML(
                            appointment.name
                        ) +

                        "</h3>" +

                        "<p><strong>Phone:</strong> " +

                        escapeHTML(
                            appointment.phone || "-"
                        ) +

                        "</p>" +

                        "<p><strong>Person:</strong> " +

                        escapeHTML(
                            appointment.person || "-"
                        ) +

                        "</p>" +

                        "<p><strong>Date:</strong> " +

                        escapeHTML(
                            appointment.date || "-"
                        ) +

                        "</p>" +

                        "<p><strong>Time:</strong> " +

                        escapeHTML(
                            appointment.time || "-"
                        ) +

                        "</p>" +

                        "<p><strong>Purpose:</strong> " +

                        escapeHTML(
                            appointment.purpose || "-"
                        ) +

                        "</p>" +

                        '<button type="button" onclick="deleteAppointment(' +

                        appointment.id +

                        ')">Cancel</button>';


                    list.appendChild(card);

                }
            );

        }

    }

}


/* ============================================================
   CREATE APPOINTMENT
   ============================================================ */

async function createAppointment(
    form,
    extra
) {

    const formData =
        new FormData(form);


    const appointment = {

        name:
            String(
                formData.get("name") || ""
            ).trim(),

        phone:
            String(
                formData.get("phone") || ""
            ).trim(),

        person:
            String(
                formData.get("person") || ""
            ).trim(),

        date:
            String(
                formData.get("date") || ""
            ).trim(),

        time:
            String(
                formData.get("time") || ""
            ).trim(),

        purpose:
            String(
                formData.get("purpose") || ""
            ).trim()

    };


    if (
        extra &&
        extra.source
    ) {

        appointment.source =
            extra.source;

    }


    return await createAppointmentDirect(
        appointment
    );

}


/* ============================================================
   DIRECT APPOINTMENT BOOKING
   ============================================================ */

async function createAppointmentDirect(
    appointmentData
) {

    try {

        const response =
            await fetch(
                API_URL +
                "/api/appointments",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            appointmentData
                        )
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                data.error ||
                "Appointment booking failed."
            );

        }


        await loadAppointments();

        await loadStatistics();


        return {
            ok: true,
            data: data
        };


    } catch (error) {

        console.error(
            "Appointment booking error:",
            error
        );


        return {
            ok: false,
            message: error.message
        };

    }

}


/* ============================================================
   DELETE APPOINTMENT
   ============================================================ */

async function deleteAppointment(id) {

    if (
        !window.confirm(
            "Are you sure you want to cancel this appointment?"
        )
    ) {

        return;

    }


    try {

        const response =
            await fetch(
                API_URL +
                "/api/appointments/" +
                id,
                {
                    method: "DELETE"
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Cancellation failed."
            );

        }


        await loadAppointments();

        await loadStatistics();


    } catch (error) {

        console.error(error);

        window.alert(
            "Unable to cancel appointment."
        );

    }

}


/* ============================================================
   STATISTICS
   ============================================================ */

async function loadStatistics() {

    try {

        const response =
            await fetch(
                API_URL + "/api/stats"
            );


        if (!response.ok) {
            throw new Error(
                "Statistics error."
            );
        }


        const data =
            await response.json();


        if (!data.success) {
            throw new Error(
                data.message ||
                "Statistics error."
            );
        }


        setText(
            "visitorCount",
            data.totalVisitors
        );


        setText(
            "appointmentCount",
            data.totalAppointments
        );


        if (
            document.getElementById(
                "todayAppointmentCount"
            )
        ) {

            setText(
                "todayAppointmentCount",
                data.todayAppointments
            );

        }


    } catch (error) {

        console.error(
            "Statistics error:",
            error
        );

    }

}


/* ============================================================
   VOICE BUTTONS
   ============================================================ */

function setupVoiceButtons() {

    const SpeechRecognitionAPI =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    const visitorButton =
        document.getElementById(
            "visitorMicBtn"
        );


    const appointmentButton =
        document.getElementById(
            "appointmentMicBtn"
        );


    if (!SpeechRecognitionAPI) {

        if (visitorButton) {
            visitorButton.disabled = true;
        }

        if (appointmentButton) {
            appointmentButton.disabled = true;
        }

        return;

    }


    if (visitorButton) {

        visitorButton.addEventListener(
            "click",
            function () {

                startFormVoice(
                    "visitor"
                );

            }
        );

    }


    if (appointmentButton) {

        appointmentButton.addEventListener(
            "click",
            function () {

                startFormVoice(
                    "appointment"
                );

            }
        );

    }

}


/* ============================================================
   FORM VOICE
   ============================================================ */

function startFormVoice(type) {

    const SpeechRecognitionAPI =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    if (!SpeechRecognitionAPI) {

        window.alert(
            "Voice recognition is not supported. Please use Chrome or Edge."
        );

        return;

    }


    const recognition =
        new SpeechRecognitionAPI();


    recognition.lang =
        "en-IN";

    recognition.continuous =
        false;

    recognition.interimResults =
        false;


    const statusId =
        type === "visitor"
            ? "visitorVoiceStatus"
            : "appointmentVoiceStatus";


    const buttonId =
        type === "visitor"
            ? "visitorMicBtn"
            : "appointmentMicBtn";


    const button =
        document.getElementById(
            buttonId
        );


    setStatus(
        statusId,
        "Listening..."
    );


    if (button) {
        button.textContent =
            "Listening...";
    }


    recognition.start();


    recognition.onresult =
        function (event) {

            const text =
                event.results[0][0]
                    .transcript;


            setStatus(
                statusId,
                "Heard: " + text
            );


            const data =
                parseVoiceCommand(
                    text
                );


            if (
                type === "visitor"
            ) {

                fillVisitorForm(
                    data
                );

            } else {

                fillAppointmentForm(
                    data
                );

            }

        };


    recognition.onerror =
        function (event) {

            setStatus(
                statusId,
                "Voice error: " +
                event.error
            );

        };


    recognition.onend =
        function () {

            if (button) {

                button.textContent =
                    "Use Microphone";

            }

        };

}


/* ============================================================
   PARSE VOICE COMMAND
   ============================================================ */

function parseVoiceCommand(
    text
) {

    return {

        name:
            extractName(text),

        phone:
            parsePhone(text),

        person:
            extractPerson(text),

        purpose:
            extractPurpose(text),

        date:
            parseDateToISO(text),

        time:
            parseTimeToHHMM(text)

    };

}


/* ============================================================
   NAME
   ============================================================ */

function extractName(text) {

    const match =
        text.match(
            /(?:name is|name|for)\s+([a-zA-Z ]+)/i
        );


    if (!match) {
        return "";
    }


    return cleanValue(
        match[1]
    );

}


/* ============================================================
   PERSON
   ============================================================ */

function extractPerson(text) {

    const match =
        text.match(
            /(?:meet|with)\s+(?:doctor\s+)?([a-zA-Z ]+)/i
        );


    if (!match) {
        return "";
    }


    return cleanValue(
        match[1]
    );

}


/* ============================================================
   PURPOSE
   ============================================================ */

function extractPurpose(text) {

    const match =
        text.match(
            /(?:purpose is|purpose|reason is|reason)\s+(.+)/i
        );


    if (!match) {
        return "";
    }


    return cleanValue(
        match[1]
    );

}


/* ============================================================
   PHONE
   ============================================================ */

function parsePhone(text) {

    const digitWords = {

        zero: "0",
        oh: "0",
        one: "1",
        two: "2",
        three: "3",
        four: "4",
        five: "5",
        six: "6",
        seven: "7",
        eight: "8",
        nine: "9"

    };


    let converted =
        text.toLowerCase();


    Object.keys(
        digitWords
    ).forEach(
        function (word) {

            const regex =
                new RegExp(
                    "\\b" +
                    word +
                    "\\b",
                    "gi"
                );


            converted =
                converted.replace(
                    regex,
                    digitWords[word]
                );

        }
    );


    const number =
        converted.match(
            /\+?\d[\d\s-]{7,}\d/
        );


    if (!number) {
        return "";
    }


    return number[0]
        .replace(
            /[\s-]/g,
            ""
        );

}


/* ============================================================
   TIME
   ============================================================ */

function parseTimeToHHMM(
    text
) {

    const match =
        text.match(
            /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i
        );


    if (!match) {
        return "";
    }


    let hour =
        parseInt(
            match[1],
            10
        );


    const minute =
        match[2]
            ? parseInt(
                match[2],
                10
            )
            : 0;


    const period =
        match[3]
            ? match[3].toLowerCase()
            : "";


    if (
        period === "pm" &&
        hour < 12
    ) {

        hour += 12;

    }


    if (
        period === "am" &&
        hour === 12
    ) {

        hour = 0;

    }


    if (
        hour > 23 ||
        minute > 59
    ) {

        return "";

    }


    return (
        String(hour).padStart(2, "0") +
        ":" +
        String(minute).padStart(2, "0")
    );

}


/* ============================================================
   DATE
   ============================================================ */

function parseDateToISO(
    text
) {

    const lower =
        text.toLowerCase();


    if (
        lower.includes("today")
    ) {

        return getLocalDate(
            new Date()
        );

    }


    if (
        lower.includes("tomorrow")
    ) {

        const date =
            new Date();

        date.setDate(
            date.getDate() + 1
        );


        return getLocalDate(
            date
        );

    }


    const months = {

        january: 1,
        february: 2,
        march: 3,
        april: 4,
        may: 5,
        june: 6,
        july: 7,
        august: 8,
        september: 9,
        october: 10,
        november: 11,
        december: 12

    };


    for (
        const monthName in months
    ) {

        const regex =
            new RegExp(
                monthName +
                "\\s+(\\d{1,2})(?:\\s+(20\\d{2}))?",
                "i"
            );


        const match =
            lower.match(
                regex
            );


        if (match) {

            const month =
                months[monthName];


            const day =
                parseInt(
                    match[1],
                    10
                );


            const year =
                match[2]
                    ? parseInt(
                        match[2],
                        10
                    )
                    : new Date().getFullYear();


            return (
                String(year) +
                "-" +
                String(month).padStart(
                    2,
                    "0"
                ) +
                "-" +
                String(day).padStart(
                    2,
                    "0"
                )
            );

        }

    }


    return "";

}


/* ============================================================
   LOCAL DATE
   ============================================================ */

function getLocalDate(
    date
) {

    return (
        date.getFullYear() +
        "-" +
        String(
            date.getMonth() + 1
        ).padStart(2, "0") +
        "-" +
        String(
            date.getDate()
        ).padStart(2, "0")
    );

}


/* ============================================================
   FILL VISITOR FORM
   ============================================================ */

function fillVisitorForm(
    data
) {

    setInput(
        "visitorName",
        data.name
    );


    setInput(
        "visitorPhone",
        data.phone
    );


    setInput(
        "visitorPerson",
        data.person
    );


    setInput(
        "visitorPurpose",
        data.purpose
    );


    showSection(
        "visitorSection"
    );

}


/* ============================================================
   FILL APPOINTMENT FORM
   ============================================================ */

function fillAppointmentForm(
    data
) {

    setInput(
        "appointmentName",
        data.name
    );


    setInput(
        "appointmentPhone",
        data.phone
    );


    setInput(
        "appointmentPerson",
        data.person
    );


    setInput(
        "appointmentDate",
        data.date
    );


    setInput(
        "appointmentTime",
        data.time
    );


    setInput(
        "appointmentPurpose",
        data.purpose
    );


    showSection(
        "appointmentSection"
    );

}


/* ============================================================
   FLOATING VOICE WIDGET
   ============================================================ */

function createVoiceWidget() {

    if (
        document.getElementById(
            "aiVoiceWidget"
        )
    ) {

        return;

    }


    const widget =
        document.createElement(
            "div"
        );


    widget.id =
        "aiVoiceWidget";


    widget.innerHTML =

        '<div id="aiVoicePanel">' +

        '<div class="aiVoiceTitle">' +
        "AI Receptionist" +
        "</div>" +

        '<div id="aiVoiceMessage">' +
        "Press the microphone and say what you need." +
        "</div>" +

        '<div id="aiVoiceTranscript"></div>' +

        '<button id="aiVoiceStart" type="button">' +
        "🎤" +
        "</button>" +

        '<button id="aiVoiceStop" type="button">' +
        "Stop" +
        "</button>" +

        "</div>";


    document.body.appendChild(
        widget
    );


    addVoiceWidgetStyles();


    document
        .getElementById(
            "aiVoiceStart"
        )
        .addEventListener(
            "click",
            startVoiceAssistant
        );


    document
        .getElementById(
            "aiVoiceStop"
        )
        .addEventListener(
            "click",
            stopVoiceAssistant
        );

}


/* ============================================================
   VOICE WIDGET CSS
   ============================================================ */

function addVoiceWidgetStyles() {

    if (
        document.getElementById(
            "aiVoiceWidgetStyles"
        )
    ) {

        return;

    }


    const style =
        document.createElement(
            "style"
        );


    style.id =
        "aiVoiceWidgetStyles";


    style.textContent =

        "#aiVoiceWidget {" +
        "position:fixed;" +
        "right:20px;" +
        "bottom:20px;" +
        "z-index:99999;" +
        "font-family:Arial,sans-serif;" +
        "}" +

        "#aiVoicePanel {" +
        "width:290px;" +
        "background:white;" +
        "border-radius:16px;" +
        "padding:18px;" +
        "box-shadow:0 8px 30px rgba(0,0,0,.25);" +
        "border:1px solid #ddd;" +
        "}" +

        ".aiVoiceTitle {" +
        "font-size:18px;" +
        "font-weight:bold;" +
        "margin-bottom:10px;" +
        "}" +

        "#aiVoiceMessage {" +
        "font-size:14px;" +
        "margin-bottom:10px;" +
        "color:#444;" +
        "}" +

        "#aiVoiceTranscript {" +
        "min-height:35px;" +
        "padding:8px;" +
        "background:#f4f7fb;" +
        "border-radius:8px;" +
        "font-size:13px;" +
        "margin-bottom:12px;" +
        "}" +

        "#aiVoiceStart {" +
        "width:60px;" +
        "height:60px;" +
        "border-radius:50%;" +
        "border:none;" +
        "background:#182848;" +
        "color:white;" +
        "font-size:26px;" +
        "cursor:pointer;" +
        "}" +

        "#aiVoiceStop {" +
        "margin-left:10px;" +
        "padding:10px 16px;" +
        "border:none;" +
        "border-radius:6px;" +
        "background:#e74c3c;" +
        "color:white;" +
        "cursor:pointer;" +
        "}" +

        "#aiVoiceStart.listening {" +
        "background:#e74c3c;" +
        "}";


    document.head.appendChild(
        style
    );

}


/* ============================================================
   START GLOBAL VOICE ASSISTANT
   ============================================================ */

async function startVoiceAssistant() {

    if (voiceActive) {
        return;
    }


    const SpeechRecognitionAPI =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    if (!SpeechRecognitionAPI) {

        setVoiceMessage(
            "Voice recognition is not supported. Please use Chrome or Edge."
        );

        return;

    }


    voiceActive = true;

    bookingData = {};

    bookingStep = null;


    updateVoiceButton(
        true
    );


    setVoiceMessage(
        "Voice assistant activated."
    );


    await speak(
        "Hello. How can I help you? You can say book an appointment, or register a visitor."
    );


    createRecognition(
        SpeechRecognitionAPI
    );


    listenForCommand();

}


/* ============================================================
   CREATE RECOGNITION
   ============================================================ */

function createRecognition(
    SpeechRecognitionAPI
) {

    voiceRecognition =
        new SpeechRecognitionAPI();


    voiceRecognition.lang =
        "en-IN";


    voiceRecognition.continuous =
        false;


    voiceRecognition.interimResults =
        false;


    voiceRecognition.onresult =
        async function (event) {

            const text =
                event.results[0][0]
                    .transcript
                    .trim();


            setVoiceTranscript(
                text
            );


            voiceProcessing =
                true;


            await handleVoiceCommand(
                text
            );


            voiceProcessing =
                false;


            if (
                voiceActive &&
                !bookingStep
            ) {

                setTimeout(
                    listenForCommand,
                    500
                );

            }

        };


    voiceRecognition.onerror =
        function (event) {

            console.error(
                "Voice error:",
                event.error
            );


            if (
                event.error ===
                "not-allowed"
            ) {

                setVoiceMessage(
                    "Microphone permission was denied."
                );

                stopVoiceAssistant();

            }

        };


    voiceRecognition.onend =
        function () {

            if (
                voiceActive &&
                !voiceProcessing &&
                !bookingStep
            ) {

                setTimeout(
                    listenForCommand,
                    500
                );

            }

        };

}


/* ============================================================
   LISTEN
   ============================================================ */

function listenForCommand() {

    if (
        !voiceActive ||
        !voiceRecognition
    ) {

        return;

    }


    try {

        voiceRecognition.start();

        setVoiceMessage(
            "Listening..."
        );


    } catch (error) {

        console.log(
            "Recognition already running."
        );

    }

}


/* ============================================================
   HANDLE COMMAND
   ============================================================ */

async function handleVoiceCommand(
    text
) {

    const lower =
        text.toLowerCase();


    if (
        lower.includes("book") ||
        lower.includes("appointment") ||
        lower.includes("schedule")
    ) {

        await startAppointmentConversation();

        return;

    }


    if (
        lower.includes("register") ||
        lower.includes("visitor")
    ) {

        await startVisitorConversation();

        return;

    }


    if (
        lower.includes("stop") ||
        lower.includes("cancel")
    ) {

        stopVoiceAssistant();

        return;

    }


    setVoiceMessage(
        'Please say "book an appointment" or "register visitor".'
    );


    await speak(
        'Please say book an appointment or register visitor.'
    );

}


/* ============================================================
   APPOINTMENT CONVERSATION
   ============================================================ */

async function startAppointmentConversation() {

    bookingData = {
        source: "voice"
    };


    bookingStep =
        "name";


    showSection(
        "appointmentSection"
    );


    setVoiceMessage(
        "Waiting for visitor name..."
    );


    await speak(
        "Sure. Let's book an appointment. What is the visitor's name?"
    );


    listenForBookingAnswer();

}


/* ============================================================
   BOOKING LISTENER
   ============================================================ */

function listenForBookingAnswer() {

    if (
        !voiceActive
    ) {

        return;

    }


    const SpeechRecognitionAPI =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    if (!SpeechRecognitionAPI) {
        return;
    }


    voiceRecognition =
        new SpeechRecognitionAPI();


    voiceRecognition.lang =
        "en-IN";


    voiceRecognition.continuous =
        false;


    voiceRecognition.interimResults =
        false;


    voiceRecognition.onresult =
        async function (event) {

            const text =
                event.results[0][0]
                    .transcript
                    .trim();


            setVoiceTranscript(
                text
            );


            await handleBookingAnswer(
                text
            );

        };


    voiceRecognition.onerror =
        function (event) {

            console.error(
                "Booking voice error:",
                event.error
            );


            if (
                voiceActive
            ) {

                setTimeout(
                    listenForBookingAnswer,
                    800
                );

            }

        };


    try {

        voiceRecognition.start();


        setVoiceMessage(
            "Listening..."
        );


    } catch (error) {

        console.log(
            "Already listening."
        );

    }

}


/* ============================================================
   HANDLE BOOKING ANSWERS
   ============================================================ */

async function handleBookingAnswer(
    text
) {

    if (
        /^(stop|cancel|quit|exit)$/i.test(
            text.trim()
        )
    ) {

        await speak(
            "Okay. I cancelled the appointment."
        );


        bookingStep =
            null;

        bookingData =
            {};


        setVoiceMessage(
            "Appointment cancelled."
        );


        listenForCommand();

        return;

    }


    switch (
        bookingStep
    ) {


        case "name":

            bookingData.name =
                cleanSpokenValue(
                    text
                );


            bookingStep =
                "phone";


            await speak(
                "Thank you. What is the phone number?"
            );


            listenForBookingAnswer();

            break;


        case "phone":

            bookingData.phone =
                parsePhone(text);


            if (
                !bookingData.phone
            ) {

                bookingData.phone =
                    cleanSpokenValue(
                        text
                    );

            }


            bookingStep =
                "person";


            await speak(
                "Who would the visitor like to meet?"
            );


            listenForBookingAnswer();

            break;


        case "person":

            bookingData.person =
                cleanSpokenValue(
                    text
                );


            bookingStep =
                "date";


            await speak(
                "What date should I book the appointment for? You can say today, tomorrow, or a date such as September 15."
            );


            listenForBookingAnswer();

            break;


        case "date":

            bookingData.date =
                parseDateToISO(
                    text
                );


            if (
                !bookingData.date
            ) {

                await speak(
                    "I didn't understand the date. Please say the date again."
                );


                listenForBookingAnswer();

                return;

            }


            bookingStep =
                "time";


            await speak(
                "What time should I book the appointment?"
            );


            listenForBookingAnswer();

            break;


        case "time":

            bookingData.time =
                parseTimeToHHMM(
                    text
                );


            if (
                !bookingData.time
            ) {

                await speak(
                    "I didn't understand the time. Please say it again, for example 3 PM."
                );


                listenForBookingAnswer();

                return;

            }


            bookingStep =
                "purpose";


            await speak(
                "What is the purpose of the appointment?"
            );


            listenForBookingAnswer();

            break;


        case "purpose":

            bookingData.purpose =
                cleanSpokenValue(
                    text
                );


            bookingStep =
                null;


            await automaticallyBookAppointment();


            break;

    }

}


/* ============================================================
   AUTOMATICALLY BOOK APPOINTMENT
   ============================================================ */

async function automaticallyBookAppointment() {

    setVoiceMessage(
        "Booking appointment..."
    );


    const result =
        await createAppointmentDirect(
            bookingData
        );


    if (
        !result.ok
    ) {

        setVoiceMessage(
            "Booking failed: " +
            result.message
        );


        await speak(
            "Sorry. I could not book the appointment. " +
            result.message
        );


        bookingData =
            {};


        listenForCommand();

        return;

    }


    setVoiceMessage(
        "Appointment booked successfully."
    );


    const confirmation =
        "Appointment booked successfully for " +
        bookingData.name +
        ", with " +
        bookingData.person +
        ", on " +
        bookingData.date +
        " at " +
        bookingData.time +
        ".";


    await speak(
        confirmation
    );


    fillAppointmentForm(
        bookingData
    );


    bookingData =
        {};


    listenForCommand();

}


/* ============================================================
   VISITOR CONVERSATION
   ============================================================ */

async function startVisitorConversation() {

    bookingData = {

        source: "voice"

    };


    bookingStep =
        "visitorName";


    showSection(
        "visitorSection"
    );


    await speak(
        "Sure. Let's register a visitor. What is the visitor's name?"
    );


    listenForVisitorAnswer();

}


/* ============================================================
   VISITOR LISTENER
   ============================================================ */

function listenForVisitorAnswer() {

    const SpeechRecognitionAPI =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    if (!SpeechRecognitionAPI) {
        return;
    }


    voiceRecognition =
        new SpeechRecognitionAPI();


    voiceRecognition.lang =
        "en-IN";


    voiceRecognition.continuous =
        false;


    voiceRecognition.interimResults =
        false;


    voiceRecognition.onresult =
        async function (event) {

            const text =
                event.results[0][0]
                    .transcript
                    .trim();


            setVoiceTranscript(
                text
            );


            await handleVisitorAnswer(
                text
            );

        };


    voiceRecognition.onerror =
        function () {

            if (voiceActive) {

                setTimeout(
                    listenForVisitorAnswer,
                    800
                );

            }

        };


    try {

        voiceRecognition.start();

        setVoiceMessage(
            "Listening..."
        );

    } catch (error) {

        console.log(
            "Already listening."
        );

    }

}


/* ============================================================
   HANDLE VISITOR ANSWERS
   ============================================================ */

async function handleVisitorAnswer(
    text
) {

    switch (
        bookingStep
    ) {


        case "visitorName":

            bookingData.name =
                cleanSpokenValue(
                    text
                );


            bookingStep =
                "visitorPhone";


            await speak(
                "What is the phone number?"
            );


            listenForVisitorAnswer();

            break;


        case "visitorPhone":

            bookingData.phone =
                parsePhone(text);


            bookingStep =
                "visitorPerson";


            await speak(
                "Who does the visitor want to meet?"
            );


            listenForVisitorAnswer();

            break;


        case "visitorPerson":

            bookingData.person =
                cleanSpokenValue(
                    text
                );


            bookingStep =
                "visitorPurpose";


            await speak(
                "What is the purpose of the visit?"
            );


            listenForVisitorAnswer();

            break;


        case "visitorPurpose":

            bookingData.purpose =
                cleanSpokenValue(
                    text
                );


            bookingStep =
                null;


            await automaticallyRegisterVisitor();

            break;

    }

}


/* ============================================================
   AUTOMATIC VISITOR REGISTRATION
   ============================================================ */

async function automaticallyRegisterVisitor() {

    setVoiceMessage(
        "Registering visitor..."
    );


    const visitorData = {

        name:
            bookingData.name,

        phone:
            bookingData.phone || "",

        person:
            bookingData.person || "",

        purpose:
            bookingData.purpose || ""

    };


    const result =
        await registerVisitorDirect(
            visitorData
        );


    if (
        !result.ok
    ) {

        setVoiceMessage(
            "Registration failed."
        );


        await speak(
            "Sorry. I could not register the visitor."
        );


        bookingData =
            {};


        listenForCommand();

        return;

    }


    setVoiceMessage(
        "Visitor registered successfully."
    );


    await speak(
        "Visitor " +
        visitorData.name +
        " has been registered successfully."
    );


    fillVisitorForm(
        visitorData
    );


    bookingData =
        {};


    listenForCommand();

}


/* ============================================================
   STOP VOICE ASSISTANT
   ============================================================ */

function stopVoiceAssistant() {

    voiceActive =
        false;


    voiceProcessing =
        false;


    bookingStep =
        null;


    bookingData =
        {};


    if (voiceRecognition) {

        try {

            voiceRecognition.stop();

        } catch (error) {

            console.log(error);

        }

    }


    voiceRecognition =
        null;


    updateVoiceButton(
        false
    );


    setVoiceMessage(
        "Voice assistant stopped."
    );

}


/* ============================================================
   SPEECH OUTPUT
   ============================================================ */

function speak(text) {

    return new Promise(
        function (resolve) {

            if (
                !("speechSynthesis" in window)
            ) {

                resolve();

                return;

            }


            window.speechSynthesis.cancel();


            const utterance =
                new SpeechSynthesisUtterance(
                    text
                );


            utterance.lang =
                "en-IN";


            utterance.rate =
                0.95;


            utterance.pitch =
                1;


            utterance.onend =
                function () {

                    resolve();

                };


            utterance.onerror =
                function () {

                    resolve();

                };


            window.speechSynthesis.speak(
                utterance
            );

        }
    );

}


/* ============================================================
   VOICE UI
   ============================================================ */

function setVoiceMessage(
    text
) {

    const element =
        document.getElementById(
            "aiVoiceMessage"
        );


    const status =
        document.getElementById(
            "voiceStatus"
        );


    if (element) {
        element.textContent =
            text;
    }


    if (status) {
        status.textContent =
            text;
    }

}


function setVoiceTranscript(
    text
) {

    const element =
        document.getElementById(
            "aiVoiceTranscript"
        );


    if (element) {

        element.textContent =
            text;

    }

}


function updateVoiceButton(
    active
) {

    const button =
        document.getElementById(
            "aiVoiceStart"
        );


    if (!button) {
        return;
    }


    if (active) {

        button.classList.add(
            "listening"
        );

        button.textContent =
            "🔴";

    } else {

        button.classList.remove(
            "listening"
        );

        button.textContent =
            "🎤";

    }

}


/* ============================================================
   HELPERS
   ============================================================ */

function cleanSpokenValue(
    text
) {

    return String(
        text || ""
    )
        .replace(
            /[.,!?]+$/,
            ""
        )
        .trim();

}


function cleanValue(
    text
) {

    return String(
        text || ""
    )
        .replace(
            /[.,!?]+$/,
            ""
        )
        .trim();

}


function setInput(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (
        element &&
        value
    ) {

        element.value =
            value;

    }

}


function setStatus(
    id,
    text
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            text;

    }

}


function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            String(
                value === undefined ||
                value === null
                    ? 0
                    : value
            );

    }

}


function showFormMessage(
    id,
    text,
    error
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {
        return;
    }


    element.textContent =
        text;


    element.className =
        error
            ? "msg-err"
            : "msg-ok";


    setTimeout(
        function () {

            element.textContent =
                "";

            element.className =
                "";

        },
        5000
    );

}


function escapeHTML(
    value
) {

    return String(
        value === undefined ||
        value === null
            ? ""
            : value
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* ============================================================
   MAKE FUNCTIONS AVAILABLE TO HTML
   ============================================================ */

window.deleteVisitor =
    deleteVisitor;

window.deleteAppointment =
    deleteAppointment;

window.showSection =
    showSection;
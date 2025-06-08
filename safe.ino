#include <Keypad.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <ESP32Servo.h>
#include <WiFi.h>
#include <WebServer.h>
#include <EEPROM.h>

// --- OLED setup ---
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

// --- Keypad setup ---
const byte ROWS = 4;
const byte COLS = 4;
char keys[ROWS][COLS] = {
    {'1', '2', '3', 'A'},
    {'4', '5', '6', 'B'},
    {'7', '8', '9', 'C'},
    {'*', '0', '#', 'D'}};
byte rowPins[ROWS] = {32, 33, 25, 26};
byte colPins[COLS] = {27, 14, 12, 13};
Keypad keypad = Keypad(makeKeymap(keys), rowPins, colPins, ROWS, COLS);

// --- Servo setup ---
Servo lockServo;
const int servoPin = 15;

// --- WiFi setup ---
const char *ssid = "YOUR_SSID";
const char *password = "YOUR_PASSWORD";

WebServer server(80);

// --- EEPROM setup ---
#define EEPROM_SIZE 32
#define PIN_ADDR 0 // start address in EEPROM for PIN storage
#define PIN_LENGTH 4

String enteredPIN = "";

// --- Function to display messages on OLED ---
void displayMessage(const char *line1, String line2 = "")
{
    display.clearDisplay();
    display.setTextColor(SSD1306_WHITE);
    display.setTextSize(2);
    display.setCursor(0, 10);
    display.println(line1);
    if (line2.length() > 0)
    {
        display.setCursor(0, 35);
        display.println(line2);
    }
    display.display();
}

// --- EEPROM read/write for PIN ---
String readPinFromEEPROM()
{
    char pin[PIN_LENGTH + 1];
    for (int i = 0; i < PIN_LENGTH; i++)
    {
        pin[i] = EEPROM.read(PIN_ADDR + i);
        if (pin[i] < '0' || pin[i] > '9')
            pin[i] = '0'; // sanitize if corrupted
    }
    pin[PIN_LENGTH] = '\0';
    return String(pin);
}

void writePinToEEPROM(const String &newPin)
{
    for (int i = 0; i < PIN_LENGTH; i++)
    {
        EEPROM.write(PIN_ADDR + i, newPin[i]);
    }
    EEPROM.commit();
}

// --- Check if stored PIN is valid (4 digits) ---
bool isValidPinStored()
{
    String pin = readPinFromEEPROM();
    if (pin.length() != PIN_LENGTH)
        return false;
    for (int i = 0; i < PIN_LENGTH; i++)
    {
        if (!isDigit(pin[i]))
            return false;
    }
    return true;
}

// --- Web server handlers ---
void handleRoot()
{
    String page = "<html><body>"
                  "<h2>Change PIN</h2>"
                  "<form action=\"/setpin\" method=\"POST\">"
                  "New PIN (4 digits): <input name=\"pin\" maxlength=\"4\" pattern=\"\\d{4}\" required>"
                  "<input type=\"submit\" value=\"Set PIN\">"
                  "</form>"
                  "<p>Current PIN: " +
                  readPinFromEEPROM() + "</p>"
                                        "</body></html>";
    server.send(200, "text/html", page);
}

void handleSetPin()
{
    if (server.hasArg("pin"))
    {
        String newPin = server.arg("pin");
        if (newPin.length() == PIN_LENGTH)
        {
            bool valid = true;
            for (int i = 0; i < PIN_LENGTH; i++)
            {
                if (!isDigit(newPin[i]))
                    valid = false;
            }
            if (valid)
            {
                writePinToEEPROM(newPin);
                Serial.println("PIN changed remotely to: " + newPin);
                server.send(200, "text/html", "<p>PIN updated successfully!</p><a href=\"/\">Back</a>");
                displayMessage("PIN Changed");
                delay(1500);
                displayMessage("Enter PIN:");
                enteredPIN = "";
                return;
            }
        }
    }
    server.send(400, "text/html", "<p>Invalid PIN format.</p><a href=\"/\">Back</a>");
}

void setupWiFiAndServer()
{
    Serial.println();
    Serial.print("Connecting to WiFi ");
    Serial.println(ssid);
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED)
    {
        delay(500);
        Serial.print(".");
    }
    Serial.println();
    Serial.print("WiFi connected, IP: ");
    Serial.println(WiFi.localIP());

    server.on("/", HTTP_GET, handleRoot);
    server.on("/setpin", HTTP_POST, handleSetPin);
    server.begin();
    Serial.println("HTTP server started");
}

void setup()
{
    Serial.begin(115200);

    EEPROM.begin(EEPROM_SIZE);

    // Initialize OLED
    if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C))
    {
        Serial.println("SSD1306 init failed");
        for (;;)
        {
        }
    }
    display.clearDisplay();

    // Initialize Servo
    lockServo.attach(servoPin);
    lockServo.write(0); // Locked position

    // If no valid PIN stored, set default PIN "1234"
    if (!isValidPinStored())
    {
        writePinToEEPROM("1234");
        Serial.println("Default PIN set to 1234");
    }

    displayMessage("Enter PIN:");

    setupWiFiAndServer();
}

void loop()
{
    server.handleClient();

    char key = keypad.getKey();

    if (key)
    {
        Serial.print("Pressed: ");
        Serial.println(key);

        if (key >= '0' && key <= '9')
        {
            enteredPIN += key;
            displayMessage("Enter PIN:", enteredPIN);

            if (enteredPIN.length() == PIN_LENGTH)
            {
                String correctPIN = readPinFromEEPROM();
                if (enteredPIN == correctPIN)
                {
                    displayMessage("Correct");
                    Serial.println("PIN correct!");
                    lockServo.write(90); // Unlock position (adjust angle as needed)
                    delay(3000);         // Keep unlocked for 3 seconds
                    lockServo.write(0);  // Lock again
                    enteredPIN = "";
                    displayMessage("Enter PIN:");
                }
                else
                {
                    displayMessage("Wrong PIN");
                    Serial.println("Wrong PIN!");
                    delay(3000);
                    enteredPIN = "";
                    displayMessage("Enter PIN:");
                }
            }
        }
        else if (key == '*')
        {
            enteredPIN = "";
            displayMessage("Enter PIN:");
        }
        else if (key == 'D')
        {
            // Reset servo lock manually if needed
            lockServo.write(0);
            delay(1000);
            enteredPIN = "";
            displayMessage("Enter PIN:");
        }
    }
}

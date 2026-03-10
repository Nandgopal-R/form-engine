import "dotenv/config";
const url = process.env.DATABASE_URL;
if (url) {
    console.log("Length:", url.length);
    console.log("Start:", url.substring(0, 20));
    console.log("End:", url.substring(url.length - 20));
} else {
    console.log("No URL");
}

import "dotenv/config";
const url = process.env.DATABASE_URL;
if (!url) {
    console.log("DATABASE_URL is not set.");
} else {
    const masked = url.replace(/:([^@]+)@/, ":****@");
    console.log("DATABASE_URL:", masked);
}

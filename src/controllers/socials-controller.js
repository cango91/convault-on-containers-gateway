const {SOCIALS_SERVICE_SECRET} = process.env;
if(!SOCIALS_SERVICE_SECRET) {
    console.error("Missing required app configuration");
    process.exit(1);
}

BASE_URL = process.env.SOCIAL_SERVICE_URL ? process.env.SOCIAL_SERVICE_URL : "http://localhost:3002/services/socials/api"
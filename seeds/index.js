const mongoose = require('mongoose')
const cities = require('./cities')
const { places, descriptors } = require('./seedHelpers');
const Campground = require('../models/campground')

main().catch(err => console.log(err));
async function main() {
    await mongoose.connect('mongodb://localhost:27017/yelp-camp');
}

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("DB connected")
})

const sample = array => array[Math.floor(Math.random() * array.length)];

const seedDB = async () => {
    await Campground.deleteMany({});
    for (let i = 0; i < 300; i++) {
        const random1000 = Math.floor(Math.random() * 1000);
        const price = Math.floor(Math.random() * 20) + 10;
        const camp = new Campground({
            author: '62b243e06c373b188c49cb54',
            location: `${cities[random1000].city}, ${cities[random1000].state}`,
            title: `${sample(descriptors)} ${sample(places)}`,
            description: 'ipsum dolor sit amet consectetur adipisicing elit. Voluptates rem minima labore similique nulla debitis enim modi, unde obcaecati exercitationem deleniti nihil nobis quisquam dolores perspiciatis reiciendis pariatur tenetur autem.',
            price,
            geometry: {
                type: "Point",
                coordinates: [
                    cities[random1000].longitude,
                    cities[random1000].latitude
                ]
            },
            images: [
                {
                    url: 'https://res.cloudinary.com/djqcxlpdj/image/upload/v1655925387/YelpCamp/y2vz24gfababllevimso.jpg',
                    filename: 'YelpCamp/y2vz24gfababllevimso',
                },
                {
                    url: 'https://res.cloudinary.com/djqcxlpdj/image/upload/v1655925387/YelpCamp/olbbsncn7fxnnwxhyk38.jpg',
                    filename: 'YelpCamp/olbbsncn7fxnnwxhyk38',
                }
            ]
        })
        await camp.save();
    }
}

seedDB().then(() => {
    mongoose.connection.close();
});
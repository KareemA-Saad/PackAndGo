import { collection, onSnapshot } from "firebase/firestore";

export const productsData = (db) => {
    const productsCollection = collection(db, 'productsData');
    onSnapshot(productsCollection, (snapshot) => {
        console.log("Total products:", snapshot.size);
        snapshot.docs.forEach(doc => {
            console.log('doc', doc.data(), doc.id);
            console.log("code:", doc.data().code);
            console.log("title:", doc.data().title);
            console.log("description:", doc.data().description);
            console.log("category:", doc.data().category);
            console.log("price:", doc.data().price);
            console.log("discountPercentage:", doc.data().discountPercentage);
            console.log("quantity:", doc.data().quantity);
            console.log("returnPolicy:", doc.data().returnPolicy);
            console.log("colorHEX:", doc.data().colorHEX);
            console.log("color:", doc.data().color);
            console.log("image:", doc.data().image);
            console.log("info:", doc.data().info);
        });
    });
}
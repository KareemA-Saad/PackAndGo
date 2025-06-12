import { collection, addDoc, getDocs } from "firebase/firestore";

export const addProductToFirestore = async (db, allProducts) => {
    try {
        const existingSnapshot = await getDocs(collection(db, "productsData"));
        const existingCodes = new Set();
        existingSnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.code) {
                existingCodes.add(data.code);
            }
        });
        for (const product of allProducts) {
            if (!existingCodes.has(product.code)) {
                await addDoc(collection(db, "productsData"), product);
                console.log(`Added: ${product.title} (code: ${product.code})`);
            } else {
                console.log(`(duplicate code): ${product.title} (code: ${product.code})`);
            }
        }
    } catch (e) {
        console.error("Error adding document:", e);
    }
};


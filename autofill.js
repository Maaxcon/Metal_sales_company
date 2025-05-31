// Скрипт для заповнення Firebase бази даних арматурою
// Запустіть цей код в консолі браузера на сторінці каталогу після ініціалізації Firebase

async function populateRebarData() {
    const rebarData = [
        {
            name: "Арматура А400 діаметр 8мм",
            diameter: 8,
            class: "A400",
            length: 12,
            price: 45.50,
            description: "Арматурна сталь періодичного профілю класу А400 діаметром 8мм",
            image: "/img/rebar/rebar-8mm.jpg",
            inStock: true,
            category: "construction",
            weight: 0.395, // кг/м
            minOrder: 12,
            badge: "Популярне"
        },
        {
            name: "Арматура А400 діаметр 10мм",
            diameter: 10,
            class: "A400", 
            length: 12,
            price: 52.80,
            description: "Арматурна сталь періодичного профілю класу А400 діаметром 10мм",
            image: "/img/rebar/rebar-10mm.jpg",
            inStock: true,
            category: "construction",
            weight: 0.617,
            minOrder: 12,
            badge: "Хіт продажів"
        },
        {
            name: "Арматура А400 діаметр 12мм",
            diameter: 12,
            class: "A400",
            length: 12,
            price: 48.30,
            description: "Арматурна сталь періодичного профілю класу А400 діаметром 12мм",
            image: "/img/rebar/rebar-12mm.jpg",
            inStock: true,
            category: "construction",
            weight: 0.888,
            minOrder: 12
        },
        {
            name: "Арматура А400 діаметр 14мм",
            diameter: 14,
            class: "A400",
            length: 12,
            price: 49.90,
            description: "Арматурна сталь періодичного профілю класу А400 діаметром 14мм",
            image: "/img/rebar/rebar-14mm.jpg",
            inStock: true,
            category: "construction",
            weight: 1.21,
            minOrder: 12
        },
        {
            name: "Арматура А400 діаметр 16мм",
            diameter: 16,
            class: "A400",
            length: 12,
            price: 47.60,
            description: "Арматурна сталь періодичного профілю класу А400 діаметром 16мм",
            image: "/img/rebar/rebar-16mm.jpg",
            inStock: true,
            category: "construction",
            weight: 1.58,
            minOrder: 12,
            badge: "Популярне"
        },
        {
            name: "Арматура А400 діаметр 18мм",
            diameter: 18,
            class: "A400",
            length: 12,
            price: 46.80,
            description: "Арматурна сталь періодичного профілю класу А400 діаметром 18мм",
            image: "/img/rebar/rebar-18mm.jpg",
            inStock: true,
            category: "construction",
            weight: 2.00,
            minOrder: 12
        },
        {
            name: "Арматура А400 діаметр 20мм",
            diameter: 20,
            class: "A400",
            length: 12,
            price: 46.20,
            description: "Арматурна сталь періодичного профілю класу А400 діаметром 20мм",
            image: "/img/rebar/rebar-20mm.jpg",
            inStock: true,
            category: "construction",
            weight: 2.47,
            minOrder: 12
        },
        {
            name: "Арматура А400 діаметр 22мм",
            diameter: 22,
            class: "A400",
            length: 12,
            price: 45.90,
            description: "Арматурна сталь періодичного профілю класу А400 діаметром 22мм",
            image: "/img/rebar/rebar-22mm.jpg",
            inStock: false,
            category: "construction",
            weight: 2.98,
            minOrder: 12,
            badge: "Під замовлення"
        },
        {
            name: "Арматура А400 діаметр 25мм",
            diameter: 25,
            class: "A400",
            length: 12,
            price: 45.30,
            description: "Арматурна сталь періодичного профілю класу А400 діаметром 25мм",
            image: "/img/rebar/rebar-25mm.jpg",
            inStock: true,
            category: "construction",
            weight: 3.85,
            minOrder: 12
        },
        {
            name: "Арматура А400 діаметр 28мм",
            diameter: 28,
            class: "A400",
            length: 12,
            price: 44.80,
            description: "Арматурна сталь періодичного профілю класу А400 діаметром 28мм",
            image: "/img/rebar/rebar-28mm.jpg",
            inStock: true,
            category: "construction",
            weight: 4.83,
            minOrder: 12
        },
        {
            name: "Арматура А400 діаметр 32мм",
            diameter: 32,
            class: "A400",
            length: 12,
            price: 44.50,
            description: "Арматурна сталь періодичного профілю класу А400 діаметром 32мм",
            image: "/img/rebar/rebar-32mm.jpg",
            inStock: false,
            category: "construction",
            weight: 6.31,
            minOrder: 12,
            badge: "Під замовлення"
        },
        // Арматура класу A500C
        {
            name: "Арматура А500С діаметр 10мм",
            diameter: 10,
            class: "A500C",
            length: 12,
            price: 58.20,
            description: "Арматурна сталь зварювана класу А500С діаметром 10мм",
            image: "/img/rebar/rebar-a500c-10mm.jpg",
            inStock: true,
            category: "construction",
            weight: 0.617,
            minOrder: 12,
            badge: "Нове"
        },
        {
            name: "Арматура А500С діаметр 12мм",
            diameter: 12,
            class: "A500C",
            length: 12,
            price: 54.80,
            description: "Арматурна сталь зварювана класу А500С діаметром 12мм",
            image: "/img/rebar/rebar-a500c-12mm.jpg",
            inStock: true,
            category: "construction",
            weight: 0.888,
            minOrder: 12
        },
        {
            name: "Арматура А500С діаметр 16мм",
            diameter: 16,
            class: "A500C",
            length: 12,
            price: 52.30,
            description: "Арматурна сталь зварювана класу А500С діаметром 16мм",
            image: "/img/rebar/rebar-a500c-16mm.jpg",
            inStock: true,
            category: "construction",
            weight: 1.58,
            minOrder: 12
        },
        // Арматура класу A240
        {
            name: "Арматура А240 діаметр 8мм",
            diameter: 8,
            class: "A240",
            length: 12,
            price: 42.10,
            description: "Арматурна сталь гладка класу А240 діаметром 8мм",
            image: "/img/rebar/rebar-a240-8mm.jpg",
            inStock: true,
            category: "construction",
            weight: 0.395,
            minOrder: 12
        },
        {
            name: "Арматура А240 діаметр 10мм",
            diameter: 10,
            class: "A240",
            length: 12,
            price: 43.50,
            description: "Арматурна сталь гладка класу А240 діаметром 10мм",
            image: "/img/rebar/rebar-a240-10mm.jpg",
            inStock: true,
            category: "construction",
            weight: 0.617,
            minOrder: 12
        }
    ];

    console.log('Починаємо заповнення бази даних...');
    
    try {
        const batch = db.batch();
        
        rebarData.forEach((item, index) => {
            const docRef = db.collection('rebar').doc();
            batch.set(docRef, {
                ...item,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        });
        
        await batch.commit();
        console.log('✅ База даних успішно заповнена!');
        console.log(`Додано ${rebarData.length} товарів арматури`);
        
    } catch (error) {
        console.error('❌ Помилка при заповненні бази:', error);
    }
}

// Функція для видалення всіх товарів (якщо потрібно почистити колекцію)
async function clearRebarCollection() {
    const snapshot = await db.collection('rebar').get();
    const batch = db.batch();
    
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log('Колекція очищена');
}

// Запустіть цю функцію для заповнення бази
// populateRebarData();
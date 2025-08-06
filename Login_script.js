// هذا يجب أن يكون API الخاص بملف Google Sheet "Users" المستقل
const USERS_API_URL = 'https://sheetdb.io/api/v1/c15b3ne610k8c'; // استخدم الـ ID من الـ API الثاني

const loginForm = document.getElementById('loginForm');
const messageDiv = document.getElementById('message');

// إضافة مستمع لحدث الإرسال (submit) للنموذج
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // منع الإرسال الافتراضي للصفحة لتتم معالجته بواسطة JavaScript

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // عرض رسالة "جاري التحقق" للمستخدم
    messageDiv.textContent = 'جاري التحقق من البيانات...';
    messageDiv.className = 'loading'; // تطبيق نمط التحميل

    try {
        // إرسال طلب GET إلى SheetDB.io للبحث عن مستخدم يطابق اسم المستخدم وكلمة المرور
        // SheetDB.io/search? يتيح لنا البحث بناءً على أعمدة محددة
        const response = await fetch(`${USERS_API_URL}/search?Username=${username}&Password=${password}`);
        
        // تحويل الاستجابة إلى JSON
        const users = await response.json();

        // التحقق مما إذا تم العثور على أي مستخدمين يطابقون البيانات
        if (users.length > 0) {
            const user = users[0]; // نأخذ أول مستخدم تم العثور عليه
            const userName = user.Name;   // الحصول على الاسم الفعلي للمستخدم
            const userRole = user.Role;   // الحصول على دور المستخدم (admin أو employee)

            // حفظ نوع المستخدم واسمه في Local Storage
            // هذا يسمح لنا بالوصول إلى هذه المعلومات في الصفحات الأخرى بعد تسجيل الدخول
            localStorage.setItem('loggedInUserType', userRole); 
            localStorage.setItem('loggedInUserName', userName); 

            // توجيه المستخدم إلى الصفحة المناسبة بناءً على دوره
            if (userRole === 'admin') {
                window.location.href = 'manager_dashboard.html'; // توجيه المدير إلى لوحة تحكم المدير
            } else if (userRole === 'employee') {
                window.location.href = 'index.html'; // توجيه الموظف إلى صفحة عرض المهام الخاصة به
            } else {
                // في حال وجود دور غير معرف في Google Sheet
                messageDiv.textContent = 'دور المستخدم غير معرف. يرجى الاتصال بالمسؤول.';
                messageDiv.className = 'error';
            }
            return; // إنهاء الدالة بعد التوجيه أو إظهار الخطأ
        } else {
            // إذا لم يتم العثور على أي مستخدم يطابق اسم المستخدم وكلمة المرور
            messageDiv.textContent = 'اسم المستخدم أو كلمة المرور غير صحيحة.';
            messageDiv.className = 'error'; // تطبيق نمط الخطأ
        }

    } catch (error) {
        // التعامل مع أي أخطاء تحدث أثناء عملية جلب البيانات أو الشبكة
        console.error('حدث خطأ أثناء تسجيل الدخول:', error);
        messageDiv.textContent = `حدث خطأ: ${error.message}. يرجى المحاولة مرة أخرى.`;
        messageDiv.className = 'error'; // تطبيق نمط الخطأ
    }
});
const SHEETDB_MAIN_API_URL = 'https://sheetdb.io/api/v1/gv7yywbjg53qh';

// الحصول على عناصر DOM
const tasksTableBody = document.getElementById('tasksTableBody');
const employeeNameSpan = document.getElementById('employeeNameSpan');
const pendingCount = document.getElementById('pendingCount');
const completedCount = document.getElementById('completedCount');
const logoutBtn = document.getElementById('logoutBtn');
const filterButtons = document.querySelectorAll('.filter-btn');
const openAddTaskModalBtn = document.getElementById('openAddTaskModalBtn');
const addTaskModal = document.getElementById('addTaskModal');
const closeAddTaskModalBtn = addTaskModal.querySelector('.close-button');
const addTaskForm = document.getElementById('addTaskForm');
const responseMessage = document.getElementById('responseMessage');
const taskDateInput = document.getElementById('taskDate');
const taskDayOfWeekSelect = document.getElementById('taskDayOfWeek');


let loggedInUserName = '';
let allTasksData = [];

// دالة التحقق من تسجيل دخول الموظف
function checkEmployeeLogin() {
    const userType = localStorage.getItem('loggedInUserType');
    loggedInUserName = localStorage.getItem('loggedInUserName');
    if (!userType || userType !== 'employee' || !loggedInUserName) {
        alert('يجب تسجيل الدخول كموظف للوصول إلى هذه الصفحة.');
        window.location.href = 'login.html';
        return false;
    }
    employeeNameSpan.textContent = loggedInUserName;
    return true;
}

// دالة جلب كل المهام من قاعدة البيانات
async function fetchAllTasks() {
    try {
        const response = await fetch(SHEETDB_MAIN_API_URL);
        if (!response.ok) {
            throw new Error(`خطأ في الشبكة أو الخادم: ${response.status} ${response.statusText}`);
        }
        allTasksData = await response.json();
        console.log('تم تحميل جميع المهام بنجاح.');
    } catch (error) {
        console.error('حدث خطأ أثناء جلب المهام:', error);
        alert(`حدث خطأ في تحميل المهام: ${error.message}`);
    }
}

// دالة عرض المهام وتحديث العدادات
function displayTasks(filter = 'all') {
    const employeeTasks = allTasksData.filter(task => task.الموظف === loggedInUserName);
    
    // تحديث العدادات
    const underReviewAndPending = employeeTasks.filter(task => task.الحالة === 'قيد التنفيذ' || task.الحالة === 'قيد المراجعة');
    const completedTasks = employeeTasks.filter(task => task.الحالة === 'مكتملة');
    pendingCount.textContent = underReviewAndPending.length;
    completedCount.textContent = completedTasks.length;

    let filteredTasks = employeeTasks;
    if (filter === 'week') {
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        filteredTasks = employeeTasks.filter(task => {
            if (!task.التاريخ) return false;
            const taskDate = new Date(task.التاريخ);
            return taskDate >= startOfWeek && taskDate <= endOfWeek;
        });
    } else if (filter === 'month') {
        const currentMonth = new Date().getMonth();
        filteredTasks = employeeTasks.filter(task => {
            if (!task.التاريخ) return false;
            const taskDate = new Date(task.التاريخ);
            return taskDate.getMonth() === currentMonth;
        });
    } else if (filter === 'قيد التنفيذ') {
        filteredTasks = employeeTasks.filter(task => task.الحالة === 'قيد التنفيذ');
    } else if (filter === 'مكتملة') {
        filteredTasks = employeeTasks.filter(task => task.الحالة === 'مكتملة');
    } else if (filter === 'قيد المراجعة') {
        filteredTasks = employeeTasks.filter(task => task.الحالة === 'قيد المراجعة');
    }

    tasksTableBody.innerHTML = '';
    
    if (filteredTasks.length === 0) {
        tasksTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center;">لا توجد مهام مخصصة لك حاليًا.</td></tr>`;
        return;
    }
    
    filteredTasks.forEach(task => {
        const row = document.createElement('tr');
        let actionButton = '';

        // زر إرسال المهمة للمراجعة يظهر فقط للحالة "قيد التنفيذ"
        if (task.الحالة === 'قيد التنفيذ') {
            actionButton = `
                <i class="fas fa-check-circle action-icon done-icon" 
                   title="إرسال للمراجعة"
                   onclick="updateTaskStatus('${task.ID}', 'قيد المراجعة')"></i>
            `;
        } else if (task.الحالة === 'قيد المراجعة') {
            actionButton = `
                <i class="fas fa-eye action-icon review-icon" title="المهمة قيد المراجعة"></i>
            `;
        }

        row.innerHTML = `
            <td>${task.التاريخ || ''}</td>
            <td>${task.المهمة || ''}</td>
            <td>${task.العدد || ''}</td>
            <td class="status-cell">${task.الحالة || ''}</td>
            <td>${task.ملاحظات || ''}</td>
            <td>${actionButton}</td>
        `;
        tasksTableBody.appendChild(row);
    });
}

// دالة تحديث حالة المهمة
async function updateTaskStatus(taskId, newStatus) {
    if (!confirm(`هل أنت متأكد من إرسال هذه المهمة للمراجعة؟`)) {
        return;
    }
    try {
        const response = await fetch(`${SHEETDB_MAIN_API_URL}/ID/${taskId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: { 'الحالة': newStatus } })
        });
        if (!response.ok) {
            throw new Error(`خطأ في تحديث الحالة: ${response.status} ${response.statusText}`);
        }
        alert('تم إرسال المهمة للمراجعة بنجاح.');
        await fetchAllTasks();
        displayTasks();
    } catch (error) {
        console.error('فشل في تحديث حالة المهمة:', error);
        alert(`فشل في تحديث حالة المهمة: ${error.message}`);
    }
}

// دالة إضافة مهمة جديدة من قبل الموظف
async function addNewTask(event) {
    event.preventDefault();

    try {
        const allTasksResponse = await fetch(SHEETDB_MAIN_API_URL);
        const allTasksData = await allTasksResponse.json();
        const lastId = allTasksData.length > 0 ? Math.max(...allTasksData.map(t => parseInt(t.ID) || 0)) : 0;
        const newId = lastId + 1;

        const taskData = {
            'ID': newId, 
            'التاريخ': taskDateInput.value,
            'يوم الأسبوع': taskDayOfWeekSelect.value,
            'نوع المهمة': document.getElementById('taskType').value,
            'المهمة': document.getElementById('taskName').value,
            'العدد': document.getElementById('taskQuantity').value,
            'الحالة': 'قيد المراجعة',
            'ملاحظات': document.getElementById('taskNotes').value,
            'الموظف': loggedInUserName,
            'أضيف بواسطة': loggedInUserName
        };

        const response = await fetch(SHEETDB_MAIN_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: taskData })
        });

        if (!response.ok) {
            throw new Error(`خطأ في إضافة المهمة: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        console.log('تمت إضافة المهمة بنجاح:', result);
        responseMessage.textContent = 'تمت إضافة المهمة بنجاح وإرسالها للمراجعة.';
        responseMessage.className = 'response-message success';
        addTaskForm.reset();
        await fetchAllTasks();
        displayTasks();
        setTimeout(() => {
            addTaskModal.style.display = 'none';
            responseMessage.textContent = '';
        }, 3000);
    } catch (error) {
        console.error('فشل في إضافة المهمة:', error);
        responseMessage.textContent = `فشل في إضافة المهمة: ${error.message}`;
        responseMessage.className = 'response-message error';
    }
}

// دالة للخروج
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('loggedInUserType');
    localStorage.removeItem('loggedInUserName');
    window.location.href = 'login.html';
});

// إضافة المستمعين لأزرار الفلترة
filterButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        document.querySelector('.filter-btn.active').classList.remove('active');
        e.target.classList.add('active');
        const filterValue = e.target.dataset.filter;
        displayTasks(filterValue);
    });
});

// فتح وإغلاق المودال
openAddTaskModalBtn.addEventListener('click', () => { addTaskModal.style.display = 'block'; });
closeAddTaskModalBtn.addEventListener('click', () => { addTaskModal.style.display = 'none'; });
window.addEventListener('click', (event) => { if (event.target == addTaskModal) { addTaskModal.style.display = 'none'; } });

// إضافة مستمع لنموذج إضافة مهمة جديدة
addTaskForm.addEventListener('submit', addNewTask);

// ---- بداية الكود الجديد لإصلاح الخطأ الأول ----
// خريطة أيام الأسبوع باللغة العربية
const arabicDays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

// مستمع لتحديث يوم الأسبوع تلقائيًا عند تغيير التاريخ
taskDateInput.addEventListener('change', () => {
    const selectedDate = new Date(taskDateInput.value);
    const dayIndex = selectedDate.getDay(); // 0 for الأحد, 1 for الإثنين, إلخ.
    taskDayOfWeekSelect.value = arabicDays[dayIndex];
});
// ---- نهاية الكود الجديد ----

// عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', async () => {
    if (checkEmployeeLogin()) {
        await fetchAllTasks();
        displayTasks();
    }
});

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, orderBy, query } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyCPu2xi_tQmBHOl9FZxu_q3sLoSfJj7Voc",
  authDomain: "project01-1e217.firebaseapp.com",
  projectId: "project01-1e217",
  storageBucket: "project01-1e217.firebasestorage.app",
  messagingSenderId: "438455079136",
  appId: "1:438455079136:web:4865d0ec3ed299de0bc085"
};

// エラーが起きたら画面に表示するヘルパー関数
function showErrorMessage(msg) {
    const errBox = document.getElementById('errorMessage');
    if(errBox) errBox.textContent = "エラーが発生しました: " + msg;
    console.error(msg);
}

try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);
    const storage = getStorage(app);

    const mainContent = document.getElementById('mainContent');
    const sidebarList = document.getElementById('sidebarList');
    
    // データベース監視
    const q = query(collection(db, "memos"), orderBy("createdAt", "desc"));

    onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
            if(mainContent) mainContent.innerHTML = "<p>まだ投稿がありません。</p>";
            if(sidebarList) sidebarList.innerHTML = "";
            return;
        }

        const memos = [];
        snapshot.forEach((doc) => {
            memos.push({ id: doc.id, ...doc.data() });
        });

        if (mainContent && sidebarList) {
            sidebarList.innerHTML = '';
            memos.forEach((memo) => {
                const div = document.createElement('div');
                div.classList.add('sidebar-item');
                div.textContent = memo.title;
                div.addEventListener('click', () => {
                    displayMain(memo);
                });
                sidebarList.appendChild(div);
            });
            displayMain(memos[0]);
        }
    }, (error) => {
        // ここで通信エラーをキャッチ
        showErrorMessage("データの読み込みに失敗しました。" + error.message);
    });

    // 管理画面用の処理（省略せずに記述）
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        const loginArea = document.getElementById('loginArea');
        const adminArea = document.getElementById('adminArea');
        const logoutBtn = document.getElementById('logoutBtn');
        const addBtn = document.getElementById('addBtn');

        onAuthStateChanged(auth, (user) => {
            if (user) {
                if(loginArea) loginArea.style.display = 'none';
                if(adminArea) adminArea.style.display = 'flex';
                const emailDisp = document.getElementById('userEmail');
                if(emailDisp) emailDisp.textContent = user.email;
            } else {
                if(loginArea) loginArea.style.display = 'block';
                if(adminArea) adminArea.style.display = 'none';
            }
        });

        loginBtn.addEventListener('click', async () => {
            try {
                await signInWithEmailAndPassword(auth, 
                    document.getElementById('emailInput').value, 
                    document.getElementById('passInput').value
                );
            } catch (e) { alert("ログイン失敗: " + e.message); }
        });

        if(logoutBtn) logoutBtn.addEventListener('click', async () => { await signOut(auth); });

        if(addBtn) addBtn.addEventListener('click', async function() {
            const category = document.getElementById('categorySelect').value;
            const title = document.getElementById('titleInput').value;
            const content = document.getElementById('contentInput').value;
            const imageInput = document.getElementById('imageInput');

            if (title === '' && content === '') return;

            try {
                let downloadURL = "";
                if (imageInput && imageInput.files.length > 0) {
                    const file = imageInput.files[0];
                    const fileName = new Date().getTime() + "_" + file.name;
                    const storageRef = ref(storage, "images/" + fileName);
                    await uploadBytes(storageRef, file);
                    downloadURL = await getDownloadURL(storageRef);
                }
                await addDoc(collection(db, "memos"), {
                    category: category, title: title, content: content, imageUrl: downloadURL, createdAt: new Date()
                });
                document.getElementById('titleInput').value = '';
                document.getElementById('contentInput').value = '';
                if(imageInput) imageInput.value = '';
            } catch (e) { alert("投稿エラー: " + e.message); }
        });
    }

} catch (e) {
    showErrorMessage("起動エラー: " + e.message);
}

function displayMain(data) {
    if (!document.getElementById('mainContent')) return;
    let categoryLabel = "その他";
    if (data.category === "music") categoryLabel = "🎵 作曲";
    if (data.category === "art") categoryLabel = "🎨 イラスト";
    
    let dateStr = "";
    if (data.createdAt) {
        const d = data.createdAt.toDate();
        dateStr = `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${d.getMinutes()}`;
    }

    let imageHTML = "";
    if (data.imageUrl) {
        imageHTML = `<img src="${data.imageUrl}" style="max-width:100%; border-radius:8px; margin-top:20px;">`;
    }

    document.getElementById('mainContent').innerHTML = `
        <span class="main-date">${dateStr}</span>
        <div class="main-category">${categoryLabel}</div>
        <h2 class="main-title">${escapeHTML(data.title)}</h2>
        <div class="main-body">${escapeHTML(data.content)}</div>
        ${imageHTML}
    `;
}

function escapeHTML(str) {
    if (!str) return "";
    return str.replace(/[&<>"']/g, match => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[match]));
}
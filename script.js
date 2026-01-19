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

try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);
    const storage = getStorage(app);

    const mainContent = document.getElementById('mainContent');
    const sidebarList = document.getElementById('sidebarList');
    
    // 全データを保存しておくための箱
    let allMemos = [];

    // データベース監視
    const q = query(collection(db, "memos"), orderBy("createdAt", "desc"));

    onSnapshot(q, (snapshot) => {
        allMemos = [];
        snapshot.forEach((doc) => {
            allMemos.push({ id: doc.id, ...doc.data() });
        });

        // ページ読み込み時は、現在 active になっているタブのカテゴリを表示する
        // もし active がなければ 'all' (ホーム) とする
        const activeTab = document.querySelector('nav li.active');
        const initialCat = activeTab ? activeTab.dataset.cat : 'all';
        renderList(initialCat);
    });

    // ★ 修正ポイント：IDを使わず、navタグの中のliを全て取得するように変更
    const navItems = document.querySelectorAll('nav li');
    
    // ボタンが見つかっているか確認（F12キーのコンソールに出ます）
    console.log("見つかったタブの数:", navItems.length);

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // クリックされたらログを出す
            console.log("タブがクリックされました:", item.textContent);

            // 1. デザインの切り替え
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // 2. data-cat属性を取得（HTMLに書いてある music とか art とか）
            const category = item.dataset.cat;
            
            // もしHTMLに書き忘れていたら 'all' 扱いにする安全策
            const safeCategory = category ? category : 'all';

            // 3. リストを再表示
            renderList(safeCategory);
        });
    });

    // リストとメイン画面を表示する関数
    function renderList(filterCategory) {
        if (!mainContent || !sidebarList) return;

        sidebarList.innerHTML = '';
        
        // カテゴリで絞り込み
        const filteredMemos = allMemos.filter(memo => {
            if (filterCategory === 'all') return true;
            return memo.category === filterCategory;
        });

        // データがない場合
        if (filteredMemos.length === 0) {
            mainContent.innerHTML = "<div style='padding:20px; color:#666;'>このカテゴリの投稿はまだありません。</div>";
            return;
        }

        // サイドバーを作る
        filteredMemos.forEach((memo) => {
            const div = document.createElement('div');
            div.classList.add('sidebar-item');
            div.textContent = memo.title;
            
            div.addEventListener('click', () => {
                displayMain(memo);
            });
            sidebarList.appendChild(div);
        });

        // 最新のものをメインに表示
        displayMain(filteredMemos[0]);
    }

    // --- 管理画面用 ---
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
                if(document.getElementById('userEmail')) document.getElementById('userEmail').textContent = user.email;
            } else {
                if(loginArea) loginArea.style.display = 'block';
                if(adminArea) adminArea.style.display = 'none';
            }
        });

        loginBtn.addEventListener('click', async () => {
            try { await signInWithEmailAndPassword(auth, document.getElementById('emailInput').value, document.getElementById('passInput').value); } 
            catch (e) { alert("ログイン失敗: " + e.message); }
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
    // エラーがあったら画面に出す
    alert("エラーが発生しました: " + e.message);
    console.error(e);
}

// displayMain 関数の中の label 設定部分を書き換え
function displayMain(data) {
    if (!document.getElementById('mainContent')) return;

    // ★ ここから変更
    let categoryLabel = "その他";
    let badgeColor = "#95a5a6"; // デフォルト（グレー）

    if (data.category === "music") {
        categoryLabel = "🎵 作曲";
        badgeColor = "#3498db"; // 青
    }
    if (data.category === "art") {
        categoryLabel = "🎨 イラスト";
        badgeColor = "#e91e63"; // ピンク
    }
    // ★ ここまで変更

    let dateStr = "";
    if (data.createdAt) {
        const d = data.createdAt.toDate();
        dateStr = `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${d.getMinutes()}`;
    }

    let imageHTML = "";
    if (data.imageUrl) {
        imageHTML = `<img src="${data.imageUrl}" style="max-width:100%; border-radius:8px; margin-top:20px; box-shadow:0 4px 10px rgba(0,0,0,0.1);">`;
    }

    // HTML生成部分で style="..." を使って色を反映させる
    document.getElementById('mainContent').innerHTML = `
        <span class="main-date">${dateStr}</span>
        
        <!-- styleで背景色と文字色を指定 -->
        <div class="main-category" style="background-color: ${badgeColor}; color: white;">
            ${categoryLabel}
        </div>

        <h2 class="main-title">${escapeHTML(data.title)}</h2>
        <div class="main-body">${escapeHTML(data.content)}</div>
        ${imageHTML}
    `;
}

function escapeHTML(str) {
    if (!str) return "";
    return str.replace(/[&<>"']/g, match => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[match]));
}
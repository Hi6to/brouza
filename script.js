import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, orderBy, query } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js";

// 設定（そのまま）
const firebaseConfig = {
  apiKey: "AIzaSyCPu2xi_tQmBHOl9FZxu_q3sLoSfJj7Voc",
  authDomain: "project01-1e217.firebaseapp.com",
  projectId: "project01-1e217",
  storageBucket: "project01-1e217.firebasestorage.app",
  messagingSenderId: "438455079136",
  appId: "1:438455079136:web:4865d0ec3ed299de0bc085"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// 要素の取得
const mainContent = document.getElementById('mainContent'); // ③コンテンツエリア
const sidebarList = document.getElementById('sidebarList'); // ④サイドバーエリア

// --- 管理画面用の処理（変更なし・省略しても動きますが念のため残します） ---
const loginBtn = document.getElementById('loginBtn');
if (loginBtn) { 
    // ...admin.html用のコードはそのまま...
    // 今回の変更箇所ではないので、admin.html側は以前のコードのままで大丈夫ですが
    // 閲覧ページと同じscript.jsを共有している場合は、ここにadmin用の処理が入ります。
    // もしadmin.htmlの表示がおかしくなったら教えてください。
    
    // 簡易的にadmin用処理もここに書いておきます（ログイン処理など）
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
        const email = document.getElementById('emailInput').value;
        const pass = document.getElementById('passInput').value;
        try { await signInWithEmailAndPassword(auth, email, pass); } catch (e) { alert(e.message); }
    });

    if(logoutBtn) logoutBtn.addEventListener('click', async () => { await signOut(auth); });

    if(addBtn) addBtn.addEventListener('click', async function() {
        // ...以前の投稿処理...
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
        } catch (e) { console.error(e); alert(e.message); }
    });
}


// ===============================================
// ★★★ ここからが今回の変更のメイン ★★★
// ===============================================

// データベース監視
const q = query(collection(db, "memos"), orderBy("createdAt", "desc"));

onSnapshot(q, (snapshot) => {
    // データがない場合
    if (snapshot.empty) {
        if(mainContent) mainContent.innerHTML = "<p>まだ投稿がありません。</p>";
        if(sidebarList) sidebarList.innerHTML = "";
        return;
    }

    // 全データを配列に変換する
    const memos = [];
    snapshot.forEach((doc) => {
        memos.push({ id: doc.id, ...doc.data() });
    });

    // 1. もし「閲覧ページ（mainContentがあるページ）」なら表示更新
    if (mainContent && sidebarList) {
        
        // サイドバーをリセット
        sidebarList.innerHTML = '';

        // 2. サイドバーを作る（過去の投稿リスト）
        memos.forEach((memo, index) => {
            const div = document.createElement('div');
            div.classList.add('sidebar-item');
            div.textContent = memo.title; // タイトルを表示

            // クリックしたらメイン画面に表示する処理
            div.addEventListener('click', () => {
                displayMain(memo);
            });

            sidebarList.appendChild(div);
        });

        // 3. 最新の投稿（配列の0番目）をメインに表示する
        displayMain(memos[0]);
    }

    // （管理ページ用のリスト表示機能が必要ならここに書くが、今回は閲覧ページ優先で省略）
    // もし管理ページでもリストを見たい場合は、admin.htmlの中に <div id="memoList"></div> があれば
    // 以前の renderMemo 関数を使って表示可能です。
    const adminList = document.getElementById('memoList');
    if (adminList) {
        adminList.innerHTML = '';
        memos.forEach(memo => {
             // 簡易的な管理画面用リスト表示
             const div = document.createElement('div');
             div.textContent = "・" + memo.title;
             // 削除ボタンが必要ならここに追加...
             if (auth.currentUser) {
                const delBtn = document.createElement('button');
                delBtn.textContent = '削除';
                delBtn.style.marginLeft = '10px';
                delBtn.addEventListener('click', async() => {
                    if(confirm('削除しますか？')) await deleteDoc(doc(db, "memos", memo.id));
                });
                div.appendChild(delBtn);
             }
             adminList.appendChild(div);
        });
    }
});

// ★ メインエリアに投稿内容を表示する関数
function displayMain(data) {
    if (!mainContent) return;

    let categoryLabel = "その他";
    if (data.category === "music") categoryLabel = "🎵 作曲";
    if (data.category === "art") categoryLabel = "🎨 イラスト";

    // 日付のフォーマット
    let dateStr = "";
    if (data.createdAt) {
        const d = data.createdAt.toDate();
        dateStr = `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${d.getMinutes()}`;
    }

    // 画像があるかチェック
    let imageHTML = "";
    if (data.imageUrl) {
        imageHTML = `<img src="${data.imageUrl}" style="max-width:100%; border-radius:8px; margin-top:20px;">`;
    }

    // HTMLを流し込む
    mainContent.innerHTML = `
        <span class="main-date">${dateStr}</span>
        <div class="main-category">${categoryLabel}</div>
        <h2 class="main-title">${escapeHTML(data.title)}</h2>
        <div class="main-body">${escapeHTML(data.content)}</div>
        ${imageHTML}
    `;
}

// HTMLエスケープ（セキュリティ用）
function escapeHTML(str) {
    if (!str) return "";
    return str.replace(/[&<>"']/g, function(match) {
        const escape = {'&': '&amp;','<': '&lt;','>': '&gt;','"': '&quot;',"'": '&#39;'};
        return escape[match];
    });
}
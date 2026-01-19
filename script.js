// 1. Firebaseの機能をネットから読み込む
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, orderBy, query } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// 2. あなたのFirebase設定
const firebaseConfig = {
  apiKey: "AIzaSyCPu2xi_tQmBHOl9FZxu_q3sLoSfJj7Voc",
  authDomain: "project01-1e217.firebaseapp.com",
  projectId: "project01-1e217",
  storageBucket: "project01-1e217.firebasestorage.app",
  messagingSenderId: "438455079136",
  appId: "1:438455079136:web:4865d0ec3ed299de0bc085"
};

// 3. Firebaseを起動
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 4. HTML要素の取得
const categorySelect = document.getElementById('categorySelect');
const titleInput = document.getElementById('titleInput');
const contentInput = document.getElementById('contentInput');
const addBtn = document.getElementById('addBtn');
const memoList = document.getElementById('memoList');

// 5. データベースの変更を監視する
// 「memos」という新しいコレクション名に変更しました（既存のToDoと分けるため）
// orderBy("createdAt", "desc") → 作成日の「降順（新しい順）」に並べる設定です
const q = query(collection(db, "memos"), orderBy("createdAt", "desc")); 

onSnapshot(q, (snapshot) => {
    memoList.innerHTML = ''; // 一旦リストを空にする

    snapshot.forEach((document) => {
        const data = document.data();
        const id = document.id;
        
        // 画面に表示する関数を呼ぶ
        renderMemo(id, data);
    });
});

// 6. 「記録する」ボタンが押された時
addBtn.addEventListener('click', async function() {
    const category = categorySelect.value;
    const title = titleInput.value;
    const content = contentInput.value;

    if (title === '' && content === '') {
        alert("タイトルか内容を入力してください");
        return;
    }

    // データベースに書き込む
    try {
        await addDoc(collection(db, "memos"), {
            category: category,
            title: title,
            content: content,
            createdAt: new Date()
        });
        
        // 入力欄をクリア
        titleInput.value = '';
        contentInput.value = '';
    } catch (e) {
        console.error("エラー:", e);
        alert("追加できませんでした");
    }
});

// 7. 画面に表示する関数
function renderMemo(id, data) {
    // カテゴリ表示用のラベル設定
    let categoryLabel = "その他";
    if (data.category === "music") categoryLabel = "🎵 作曲";
    if (data.category === "art") categoryLabel = "🎨 イラスト";

    const div = document.createElement('div');
    // CSSで色分けするためにクラスを追加 (category-musicなど)
    div.classList.add('memo-card', `category-${data.category}`);

    div.innerHTML = `
        <div class="memo-header">
            <span class="memo-category">${categoryLabel}</span>
            <span class="memo-title">${escapeHTML(data.title)}</span>
        </div>
        <div class="memo-content">${escapeHTML(data.content)}</div>
    `;

    // 削除ボタン
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '削除';
    deleteBtn.classList.add('delete-btn');
    deleteBtn.addEventListener('click', async function() {
        if(confirm("このメモを削除しますか？")) {
            await deleteDoc(doc(db, "memos", id));
        }
    });

    div.appendChild(deleteBtn);
    memoList.appendChild(div);
};

// セキュリティ対策：HTMLタグを無効化する関数
function escapeHTML(str) {
    if (!str) return ""; // 空の場合は空文字を返す
    return str.replace(/[&<>"']/g, function(match) {
        const escape = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        return escape[match];
    });
}
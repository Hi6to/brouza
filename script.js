// 1. Firebaseの機能をネットから読み込む
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, orderBy, query } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// 2. あなたのFirebase設定（★ここを書き換えてください！）
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
const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');

// 5. データベースの変更を監視する（リアルタイム更新！）
// 「todos」という名前のコレクション（データのまとまり）を使います
const q = query(collection(db, "todos"), orderBy("createdAt", "asc")); // 作成順に並べる

onSnapshot(q, (snapshot) => {
    // データベースに変更があるたびに、この中が実行されます
    taskList.innerHTML = ''; // 一旦リストを空にする

    snapshot.forEach((document) => {
        const taskData = document.data(); // データの中身（テキストなど）
        const taskId = document.id;       // データのID（削除に使う）
        
        // 画面に表示する関数を呼ぶ
        renderTask(taskId, taskData.text);
    });
});

// 6. 「追加」ボタンが押された時（クラウドに保存）
addBtn.addEventListener('click', async function() {
    const taskText = taskInput.value;
    if (taskText === '') return;

    // データベースに書き込む
    try {
        await addDoc(collection(db, "todos"), {
            text: taskText,
            createdAt: new Date() // 並び替え用に日時も保存
        });
        taskInput.value = ''; // 入力欄を空にする
    } catch (e) {
        console.error("エラー:", e);
        alert("追加できませんでした");
    }
});

// 7. 画面に表示する関数
function renderTask(id, text) {
    const li = document.createElement('li');
    
    const span = document.createElement('span');
    span.textContent = text;
    li.appendChild(span);

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '削除';
    deleteBtn.classList.add('delete-btn');

    // 削除ボタンが押された時（クラウドから削除）
    deleteBtn.addEventListener('click', async function() {
        // IDを指定してデータベースから削除
        await deleteDoc(doc(db, "todos", id));
    });

    li.appendChild(deleteBtn);
    taskList.appendChild(li);
};
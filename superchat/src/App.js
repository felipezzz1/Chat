import React, { useRef, useState, useEffect } from "react";
import "./App.css";

import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import "firebase/compat/auth";
import "firebase/storage";
import "firebase/analytics";

import { useAuthState } from "react-firebase-hooks/auth";
import { useCollectionData } from "react-firebase-hooks/firestore";

firebase.initializeApp({
    apiKey: "AIzaSyDFSHU-LhJuURDLiK4-oVcPHSaTMsEXlxo",
    authDomain: "chat-45a19.firebaseapp.com",
    projectId: "chat-45a19",
    storageBucket: "chat-45a19.appspot.com",
    messagingSenderId: "517210175656",
    appId: "1:517210175656:web:86e8f5dff588cf75b32a9d",
});

const auth = firebase.auth();
const firestore = firebase.firestore();

function App() {
    const [user] = useAuthState(auth);

    return (
        <div className="App">
            <header>
                <h1>Zap 2</h1>
                <SignOut />
            </header>

            <section>{user ? <ChatRoom /> : <SignIn />}</section>
        </div>
    );
}

function SignIn() {
    const signInWithGoogle = () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider);
    };

    return (
        <>
            <button className="sign-in" onClick={signInWithGoogle}>
                Login com Google
            </button>
        </>
    );
}

function SignOut() {
    return (
        auth.currentUser && (
            <button className="sign-out" onClick={() => auth.signOut()}>
                Sair
            </button>
        )
    );
}

function ChatRoom() {
    const dummy = useRef();
    const messagesRef = firestore.collection("messages");
    const messagesRefEntrou = firestore.collection("messages");
    const messagesRefSaiu = firestore.collection("messages");
    const query = messagesRef.orderBy("createdAt").limit(25);

    const [messages] = useCollectionData(query, { idField: "id" });

    const [formValue, setFormValue] = useState("");

    const [photoURL, setPhotoURL] = useState("");

    useEffect(() => {
        if (auth.currentUser.photoURL) {
            setPhotoURL(auth.currentUser.photoURL);
        } else {
            setPhotoURL(
                "https://api.adorable.io/avatars/23/abott@adorable.png"
            );
        }
    }, []);

    useEffect(() => {
        // Adiciona um registro no Firestore quando o usuário entra no chat
        const userRef = firestore.collection("users").doc(auth.currentUser.uid);
        userRef.set({ status: "online" });

        // Adiciona um registro no Firestore quando o usuário sai do chat
        return () => {
            userRef.update({ status: "offline" });
        };
    });

    const sendMessage = async e => {
        e.preventDefault();

        const { uid, photoURL } = auth.currentUser;

        await messagesRef.add({
            text: formValue,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            uid,
            photoURL,
            displayName: auth.currentUser.displayName,
        });

        if (SignIn) {
            await messagesRefEntrou.add({
                text: `${auth.currentUser.displayName} entrou no chat.`,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                system: true,
            });
        }

        if ((auth.currentUser.status = "offline")) {
            await messagesRefSaiu.add({
                text: `${auth.currentUser.displayName} saiu do chat.`,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                system: true,
            });
        }

        setFormValue("");
        dummy.current.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <>
            <main>
                <h1>{auth.currentUser.name}</h1>
                {messages &&
                    messages.map(msg => (
                        <ChatMessage key={msg.id} message={msg} />
                    ))}

                <span ref={dummy}></span>
            </main>

            <form onSubmit={sendMessage}>
                <input
                    value={formValue}
                    onChange={e => setFormValue(e.target.value)}
                    placeholder="Digite..."
                />

                <button type="submit" disabled={!formValue}>
                    ➤
                </button>
            </form>
        </>
    );
}

function ChatMessage(props) {
    const { text, uid, photoURL, displayName, system } = props.message;

    const messageClass = uid === auth.currentUser.uid ? "sent" : "received";
    const systemClass = system ? "system" : "";

    return (
        <>
            <div className={`message ${messageClass} ${systemClass}`}>
                <img
                    alt=""
                    src={
                        photoURL ||
                        "https://api.adorable.io/avatars/23/abott@adorable.png"
                    }
                />
                <h1 className="message-user">{displayName}</h1>
                <p className="message-text">{text}</p>
            </div>
        </>
    );
}

export default App;

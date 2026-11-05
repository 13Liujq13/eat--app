import { useState } from "react"
export default function FormSplitBill({selectedFriend , onSplitBill}){
    const [bill , setBill] = useState("")
    const [payByUser , setPayByUser] = useState("")
    const payByFriend = bill && payByUser !== "" ? bill - payByUser : ""
    const [whoIsPaying , setWhoIsPaying] = useState("user")


    function handleSubmit(e){
        e.preventDefault()
        if(!bill || payByUser === "") return
        onSplitBill(whoIsPaying === "user" ? payByFriend : -payByUser)
    }
    return(
        <form className="form-split-bill" onSubmit={handleSubmit}>
            <h2>Split a bill with {selectedFriend.name}</h2>
            <label>Bill value</label>
            <input type="text" value={bill} onChange={(e)=>setBill(e.target.value)}/>

            <label>Your expense</label>
            <input type="text" value={payByUser} onChange={(e)=>setPayByUser(Number(e.target.value)>bill?payByUser:Number(e.target.value))}/>

            <label>{selectedFriend.name}'s expense</label>
            <input type="text" disabled value={payByFriend}/>

            <label>Who is paying the bill?</label>
            <select value={whoIsPaying} onChange={(e)=>setWhoIsPaying(e.target.value)}>
                <option value="user">You</option>
                <option value="friend">{selectedFriend.name}</option>
            </select>

            <button className="button">Split bill</button>
        </form>
    )
}
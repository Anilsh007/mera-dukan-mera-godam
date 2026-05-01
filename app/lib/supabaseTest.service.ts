import { onAuthStateChanged } from "firebase/auth"
import { supabase } from "./supabase"
import { auth } from "./firebase"
import { getUserIdentityFromAuthUser } from "./userIdentity"

export function testInsertProduct() {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      console.error("User still not logged in")
      return
    }

    const userId = getUserIdentityFromAuthUser(user)
    if (!userId) {
      console.error("User email not found")
      return
    }

    const { data, error } = await supabase.from("products").insert([
      {
        user_id: userId,
        name: "Test Product",
        price: 100,
        quantity: 5,
        quantity_unit: "pcs",
        category: "test",
      },
    ])

    if (error) {
      console.error("Insert error:", error)
    } else {
      console.log("Insert success:", data)
    }
  })
}

'use client'

import { useState } from "react"
import {createClient} from '@/utils/supabase/client'
import { useRouter } from "next/navigation"

export default function EditProductPage(){

    const [formData, setFormData] = useState({
        product_id:'',
        sku:'',
        material:'',
        size:'',
        price:'',
        stock_quantity:0,
    })



    return(
        <h1>Aqui va el el edit variant product</h1>
    )
}
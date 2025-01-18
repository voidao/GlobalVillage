/*
 * @Author: Henry Ma henryma@edening.cn
 * @Date: 2025-01-14 14:26:26
 * @LastEditors: Henry Ma henryma@edening.cn
 * @LastEditTime: 2025-01-14 14:26:41
 * @FilePath: /GlobalVillage/src/lib/supabase.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

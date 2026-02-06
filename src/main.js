import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { List, Cell, Search, NavBar, PullRefresh, Image as VanImage, Lazyload, Swipe, SwipeItem, ActionSheet, ActionBar, ActionBarButton, Button, Form, Field, CellGroup, Icon, Dialog, Popup, DatePicker, TimePicker, Col, Row, Tab, Tabs, Switch, Collapse, CollapseItem, Loading } from 'vant'

import App from './App.vue'
import router from './router'
// 引入组件样式
import 'vant/lib/index.css'
// 必须写在vant样式后，覆盖vant样式
import './assets/main.css'

const setHtmlFontsize = () => {
  var htmlWidth = document.documentElement.clientWidth || document.body.clientWidth
  console.log('width：', htmlWidth)
  var htmlDom = document.getElementsByTagName('html')[0]
  htmlDom.style.fontSize = (htmlWidth / 37.5) + 'px'
}
window.onresize = setHtmlFontsize
setHtmlFontsize()

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(List)
app.use(Cell)
app.use(Search)
app.use(NavBar)
app.use(PullRefresh)
app.use(VanImage)
app.use(Swipe)
app.use(SwipeItem)
app.use(ActionSheet)
app.use(ActionBar)
app.use(ActionBarButton)
app.use(Button)
app.use(Form)
app.use(Field)
app.use(CellGroup)
app.use(Icon)
app.use(Dialog)
app.use(Popup)
app.use(DatePicker)
app.use(TimePicker)
app.use(Col)
app.use(Row)
app.use(Tab)
app.use(Tabs)
app.use(Switch)
app.use(Collapse)
app.use(CollapseItem)
app.use(Loading )

// 注册时可以配置额外的选项
app.use(Lazyload, {
  lazyComponent: true
})

app.mount('#app')

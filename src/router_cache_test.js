import { Router } from "./router.js";

const router = new Router(`
/ => {
    test/ => Provider(test_provider)
}
`);
router.debug = true;

router.register_provider("test_provider", ctx => console.log("Request id: " + ctx.id));

for(let i = 0; i < 1000; i++) {
    router.dispatch("/test/" + i, {id: i});
    router.dispatch("/test/" + i, {id: i});
}

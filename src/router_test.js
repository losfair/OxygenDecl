import { Router } from "./router.js";

const router = new Router(`
/ => {
    hello_world => Provider(hello_world_provider)
    test_dir/ => Provider(test_dir_provider)
}
`);

const random_value = Math.floor(Math.random() * 1000000);

router.register_provider("hello_world_provider", ctx => {
    if(ctx.value !== random_value) {
        throw new Error("Random value verification failed");
    } else {
        console.log("[+] hello_world_provider OK");
    }
});

router.register_provider("test_dir_provider", ctx => {
    console.log("[+] Calling into test_dir_provider, context:");
    console.log(ctx);
});

router.dispatch("/hello_world", {
    value: random_value
});

router.dispatch("/test_dir/a", {
    value: random_value
});

router.dispatch("/test_dir/b", {
    value: random_value
});

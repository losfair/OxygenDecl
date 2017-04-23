import { Router } from "./router.js";

const router = new Router(`
/ => {
    hello_world => Provider(hello_world_provider)
    test_dir/ => (test_middleware_1) {
        default/ => (test_middleware_2) (test_middleware_3) Provider(test_dir_default_provider)
        a => Provider(test_dir_a_provider)
        test_resource => TestResource(hello world)
    }
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

router.register_provider("test_dir_default_provider", ctx => {
    console.log("[+] Calling into test_dir_default_provider, context:");
    console.log(ctx);
});

router.register_provider("test_dir_a_provider", ctx => {
    console.log("[+] Calling into test_dir_a_provider, context:");
    console.log(ctx);
});

router.register_middleware("test_middleware_1", ctx => {
    console.log("[+] Calling into test_middleware_1, context:");
    console.log(ctx);
    return;
});

router.register_middleware("test_middleware_2", ctx => {
    console.log("[+] Calling into test_middleware_2, context:");
    console.log(ctx);
    return;
});

router.register_middleware("test_middleware_3", ctx => {
    console.log("[+] Calling into test_middleware_3, context:");
    console.log(ctx);
    return;
});

router.register_resource_handler("TestResource", (name, ctx) => {
    console.log("[+] Calling into handler for TestResource with resource name: " + name + ", context:");
    console.log(ctx);
});

router.dispatch("/hello_world", {
    value: random_value
});

router.dispatch("/test_dir/default/a", {
    value: random_value
});

router.dispatch("/test_dir/a", {
    value: random_value
});

router.dispatch("/test_dir/test_resource", {
    value: random_value
});

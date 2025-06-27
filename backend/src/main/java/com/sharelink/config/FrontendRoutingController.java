package com.sharelink.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class FrontendRoutingController {

    @GetMapping("/{path:^(?!api|static|favicon\\.ico|robots\\.txt).*$}")
    public String forward() {
        return "forward:/index.html";
    }
}

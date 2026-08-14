$fn = 96;

stem_h0 = 68;
stem_r0 = 16;
stem_r1 = 14.5;
lobe_r0 = 18;
cap_r0 = 15;

base_min_z = -lobe_r0 * 1.15;
base_max_z = 77 + cap_r0 * 1.18;
base_height = base_max_z - base_min_z;

target_height = 240;
S = target_height / base_height;

wall = 2.8;

mount_outer_d = 57;
mount_inner_d = 40.5;
mount_thickness = 7;
mount_z = -12 * S;

fiber_count = 24;
fiber_length = 4.5 * S;
fiber_radius = 0.35 * S;

lobe_rx = lobe_r0 * S;
lobe_ry = lobe_r0 * 0.95 * S;
lobe_rz = lobe_r0 * 1.15 * S;

bottom_z = base_min_z * S;

connector_bottom_z = mount_z + mount_thickness - 1;
connector_top_z = 12 * S;

function lobe_surface_z(x, y) =
    lobe_rz *
    sqrt(
        max(
            0,
            1
            - pow(x / lobe_rx, 2)
            - pow(y / lobe_ry, 2)
        )
    );

difference() {
    union() {
        outer_shell();
        mount_connector_outer();
        mount_ring_outer();
        surface_ridge();
        surface_fibers();
    }

    union() {
        clean_inner_void();
        mount_connector_void();
        e27_clearance_cut();
    }
}

module outer_shell() {
    union() {
        translate([-17 * S, 0, 0])
            scale([1.0, 0.95, 1.15])
                sphere(r = lobe_r0 * S);

        translate([17 * S, 0, 0])
            scale([1.0, 0.95, 1.15])
                sphere(r = lobe_r0 * S);

        translate([0, 0, 2 * S])
            scale([0.7, 0.65, 1.0])
                sphere(r = 15 * S);

        translate([0, 0, 8 * S])
            cylinder(
                h = stem_h0 * S,
                r1 = stem_r0 * S,
                r2 = stem_r1 * S
            );

        translate([0, 0, 72 * S])
            rotate_extrude()
                translate([14.2 * S, 0])
                    circle(r = 2.2 * S);

        translate([0, 0, 77 * S])
            scale([1.08, 1.08, 1.18])
                sphere(r = cap_r0 * S);
    }
}

module clean_inner_void() {
    union() {
        translate([-17 * S, 0, 1.5])
            scale([1.0, 0.95, 1.15])
                sphere(r = lobe_r0 * S - wall);

        translate([17 * S, 0, 1.5])
            scale([1.0, 0.95, 1.15])
                sphere(r = lobe_r0 * S - wall);

        translate([0, 0, 5 * S])
            scale([0.92, 0.82, 1.05])
                sphere(r = 16 * S);

        translate([0, 0, -2 * S])
            cylinder(
                h = 82 * S,
                r1 = stem_r0 * S - wall,
                r2 = stem_r1 * S - wall
            );

        translate([0, 0, 77 * S])
            scale([1.08, 1.08, 1.18])
                sphere(r = cap_r0 * S - wall);
    }
}

module mount_ring_outer() {
    translate([0, 0, mount_z])
        cylinder(
            h = mount_thickness,
            d = mount_outer_d,
            $fn = 96
        );
}

module mount_connector_outer() {
    hull() {
        translate([0, 0, connector_bottom_z])
            cylinder(
                h = 2,
                d = mount_outer_d,
                $fn = 96
            );

        translate([0, 0, connector_top_z])
            cylinder(
                h = 2,
                r = stem_r0 * S + 2,
                $fn = 96
            );
    }
}

module mount_connector_void() {
    hull() {
        translate([0, 0, connector_bottom_z - 2])
            cylinder(
                h = 3,
                d = mount_inner_d,
                $fn = 96
            );

        translate([0, 0, connector_top_z])
            cylinder(
                h = 3,
                r = stem_r0 * S - wall,
                $fn = 96
            );
    }
}

module e27_clearance_cut() {
    translate([0, 0, bottom_z - 5])
        cylinder(
            h = 80,
            d = mount_inner_d,
            $fn = 96
        );
}

module surface_ridge() {
    for (i = [0 : 12]) {
        z = (22 + i * 3.6) * S;
        angle = 15 + i * 5;
        rr = 14.2 * S;

        translate([
            rr * cos(angle),
            rr * sin(angle),
            z
        ])
            sphere(r = 1.15 * S);
    }
}

module surface_fibers() {
    for (side = [-1, 1]) {
        cx = side * 17 * S;

        xs = rands(-13 * S, 13 * S, fiber_count, 100 + side);
        ys = rands(-11 * S, 11 * S, fiber_count, 200 + side);
        lens = rands(
            fiber_length * 0.55,
            fiber_length * 1.25,
            fiber_count,
            300 + side
        );

        tilt_x = rands(-18, 18, fiber_count, 400 + side);
        tilt_y = rands(-18, 18, fiber_count, 500 + side);

        for (i = [0 : fiber_count - 1]) {
            lx = xs[i];
            ly = ys[i];

            ellipse_pos =
                pow(lx / lobe_rx, 2) +
                pow(ly / lobe_ry, 2);

            if (ellipse_pos < 0.68) {
                surface_z = lobe_surface_z(lx, ly);
                root_z = surface_z - 0.6 * S;

                translate([cx + lx, ly, root_z])
                    rotate([tilt_x[i], tilt_y[i], 0])
                        surface_fiber(lens[i]);
            }
        }
    }
}

module surface_fiber(len = 8) {
    cylinder(
        h = len,
        r1 = fiber_radius,
        r2 = 0.12 * S,
        $fn = 7
    );
}

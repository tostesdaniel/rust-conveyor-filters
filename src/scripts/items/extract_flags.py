"""Prints the conveyor-picker inputs of every ItemDefinition in items.preload.bundle.

The item JSON dump leaves out `hidden`, `isRedirectOf` and both conveyor
force-show flags, so they come from the bundle's embedded type trees.
Usage: python extract_flags.py <items.preload.bundle>
"""

import json
import sys

import UnityPy


def main(bundle_path: str) -> None:
    env = UnityPy.load(bundle_path)
    objects = list(env.objects)

    scripts = {
        o.path_id: o.read_typetree().get("m_ClassName")
        for o in objects
        if o.type.name == "MonoScript"
    }

    definitions = {}
    force_shown_objects = set()
    force_shown_blueprints = set()
    for o in objects:
        if o.type.name != "MonoBehaviour":
            continue
        tree = o.read_typetree()
        script = tree["m_Script"]
        # Every item script lives in this bundle. An external ref here means
        # the bundle layout changed and the flags below can't be trusted.
        if script["m_FileID"] != 0:
            continue
        cls = scripts.get(script["m_PathID"])
        if cls == "ItemDefinition":
            definitions[o.path_id] = tree
        elif cls == "ItemModConveyorOptions" and tree["ForceShowInConveyorFilter"]:
            force_shown_objects.add(tree["m_GameObject"]["m_PathID"])
        elif cls == "ItemBlueprint" and tree["forceShowInConveyorFilter"]:
            force_shown_blueprints.add(tree["m_GameObject"]["m_PathID"])

    if not definitions:
        sys.exit("no ItemDefinition found, has the bundle format changed?")

    flags = []
    for tree in definitions.values():
        game_object = tree["m_GameObject"]["m_PathID"]
        redirect = tree["isRedirectOf"]
        redirect_to = None
        if redirect["m_PathID"]:
            target = definitions.get(redirect["m_PathID"])
            if redirect["m_FileID"] != 0 or target is None:
                sys.exit(f"{tree['shortname']} redirects outside the bundle")
            redirect_to = target["itemid"]
        flags.append(
            {
                "itemId": tree["itemid"],
                "shortname": tree["shortname"],
                "hidden": bool(tree["hidden"]),
                "redirectTo": redirect_to,
                "forceShowInConveyorFilter": game_object in force_shown_objects,
                "blueprintForceShowInConveyorFilter": game_object
                in force_shown_blueprints,
            }
        )

    json.dump(flags, sys.stdout)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("usage: extract_flags.py <items.preload.bundle>")
    main(sys.argv[1])

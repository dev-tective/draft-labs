import { Copy } from "@/components/Copy";
import { Game } from "@/stores/matchStore";
import { useMatchStore } from "@/stores/matchStore";
import { CutOutBtn, CutOutBtnPrimary } from "@/components/CutOutBtn";
import { useEffect, useRef, useState } from "react";
import { ModalRef } from "@/layout/ModalLayout";
import { CreateMatchModal } from "@/components/modals/CreateMatchModal";
import { JoinLobbyModal } from "@/components/modals/JoinLobbyModal";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { WarningMessage } from "@/components/shared/WarningMessage";
import { Icon } from "@iconify/react";
import { AlertType } from "@/stores/alertStore";
import { MatchEditorField } from "./components/MatchEditorField";
import { TagSelect } from "../../components/TagSelect";
import { Team } from "@/pages/match/components/Team";

const MatchContent = () => {
    const { currentMatch, updateMatch, deleteMatch, updateLoading } = useMatchStore();

    const bansPerTeam = currentMatch?.bans_per_team ?? 3;
    const bestOf = currentMatch?.best_of ?? 3;
    const game = currentMatch?.game;

    const handleUpdateMatch = (field: 'bans_per_team' | 'best_of' | 'game', value: number | string) => {
        if (!currentMatch) return;
        updateMatch({ id: currentMatch.id, [field]: field === 'game' ? value : Number(value) });
    };

    if (!currentMatch) return null;

    return (
        <div className="w-full flex flex-col gap-6">
            {/* Header with ID and Match Settings */}
            <div className="
                flex flex-col xl:flex-row items-start justify-between 
                gap-4 pb-4 
                border-b border-slate-700
            ">
                {/* Match ID */}
                <div className="flex hover:text-cyan-400 transition-colors w-full xl:w-auto">
                    <Icon
                        icon="mage:key-fill"
                        className="text-2xl mr-2"
                    />
                    <Copy
                        value={currentMatch.id}
                        copy={currentMatch.id}
                        alert={{
                            message: "Match ID has been copied to clipboard.",
                            type: AlertType.INFO
                        }}
                        className="font-semibold"
                    />
                </div>

                {/* Match Settings */}
                <div className="flex flex-wrap gap-4 items-center">
                    <MatchEditorField
                        label="Best of"
                        fieldId="best_of"
                        disabled={updateLoading}
                        value={bestOf}
                        onChange={(value) => {
                            handleUpdateMatch('best_of', value);
                        }}
                        values={[1, 3, 5, 7]}
                    />

                    <MatchEditorField
                        disabled={updateLoading}
                        label="Bans per team"
                        fieldId="bans_per_team"
                        value={bansPerTeam}
                        onChange={(value) => {
                            handleUpdateMatch('bans_per_team', value);
                        }}
                        values={[0, 3, 5, 7]}
                    />

                    {/* Game Type */}
                    <TagSelect
                        icon="ion:game-controller"
                        field="Game"
                        options={Object.values(Game).map((g) => ({ value: g, label: g }))}
                        initialValue={game ?? null}
                        onUpdate={(newGame) => {
                            if (newGame) {
                                handleUpdateMatch('game', newGame);
                            }
                        }}
                    />
                </div>
            </div>

            <div className="ml-auto w-full md:w-1/2 xl:w-1/3">
                <CutOutBtnPrimary
                    alternative
                    icon="ic:sharp-delete"
                    text="Delete Match"
                    onClick={() => deleteMatch(currentMatch.id)}
                />
            </div>

            {/* Teams */}
            <div className="flex flex-col xl:flex-row flex-1 h-full gap-6">
                <Team index={0} />
                <span className="
                    m-auto pr-1.5
                    h-24 w-24 
                    text-center content-center
                    font-bold italic text-2xl
                    border border-slate-700 bg-slate-900
                    rounded-full beveled
                ">
                    VS
                </span>
                <Team index={1} reverse />
            </div>
        </div>
    );
};

export const Match = () => {
    const { currentMatch, loading, subscribeToMatch, unsubscribe } = useMatchStore();

    const createMatchModalRef = useRef<ModalRef>(null);
    const joinLobbyModalRef = useRef<ModalRef>(null);

    useEffect(() => {
        if (currentMatch?.id) {
            subscribeToMatch(currentMatch.id);
        }
        return () => unsubscribe();
    }, []);

    return (
        <>
            <CreateMatchModal ref={createMatchModalRef} />
            <JoinLobbyModal ref={joinLobbyModalRef} />

            <div className="min-h-full flex flex-col relative">
                <div className="
                    sticky top-0 z-10
                    flex flex-col lg:flex-row   
                    w-full gap-4 p-4
                    bg-slate-950
                    border-b border-slate-700
                ">
                    <div className="flex-1 md:flex-none lg:w-md">
                        <CutOutBtnPrimary
                            icon="material-symbols:dashboard-customize"
                            text="create match"
                            onClick={() => createMatchModalRef.current?.open()}
                        />
                    </div>
                    <div className="flex gap-4 w-full lg:max-w-sm">
                        <CutOutBtn
                            icon="lsicon:warehouse-into-filled"
                            text="join lobby"
                            onClick={() => joinLobbyModalRef.current?.open()}
                        />
                    </div>
                </div>

                <div className="flex flex-1 w-11/12 space-y-10 mx-auto py-6 md:py-10">
                    {loading ? (
                        <LoadingSpinner message="Loading match..." />
                    ) : !currentMatch ? (
                        <WarningMessage
                            title="No match found"
                            message="No active match found. Create a new match or join an existing lobby."
                        />
                    ) : (
                        <MatchContent />
                    )}
                </div>
            </div>
        </>
    );
};

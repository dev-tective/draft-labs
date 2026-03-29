import { Copy } from "@/components/Copy";
import { Game } from "@/stores/matchStore";
import { useMatchStore } from "@/stores/matchStore";
import { CutOutBtn, CutOutBtnPrimary } from "@/components/CutOutBtn";
import { useEffect, useRef, useState } from "react";
import { ModalRef } from "@/layout/ModalLayout";
import { CreateRoomModal } from "@/room/components/modal/CreateRoomModal";
import { JoinLobbyModal } from "@/staff/components/modal/JoinLobbyModal";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { WarningMessage } from "@/components/shared/WarningMessage";
import { Icon } from "@iconify/react";
import { AlertType, useAlertStore } from "@/stores/alertStore";
import { MatchEditorField } from "./components/MatchEditorField";
import { TagSelect } from "../../components/TagSelect";
import { Team } from "@/pages/match/components/Team";
import { useTeamStore } from "@/stores/teamStore";
import { StartMatchModal } from "@/components/modals/StartMatchModal";
import { ResetMatchModal } from "@/components/modals/ResetMatchModal";

const TeamSlider = () => {
    const { teams } = useTeamStore();

    const numSlides = Math.floor(teams.length / 2) + 1;

    const [currentSlide, setCurrentSlide] = useState(0);
    const safeSlide = Math.min(currentSlide, numSlides - 1);

    const leftIndex = safeSlide * 2;
    const rightIndex = safeSlide * 2 + 1;

    const showNav = numSlides > 1;

    return (
        <div className="flex-1 flex flex-col gap-5">
            {showNav && (
                <div className="flex items-center gap-3 h-12">
                    <CutOutBtn
                        icon="mdi:chevron-left"
                        onClick={() => setCurrentSlide((p) => Math.max(0, p - 1))}
                        disabled={safeSlide === 0}
                        className="h-full w-12 text-xl beveled-br-tl rounded-none rounded-tl-2xl rounded-br-2xl"
                    />

                    <div className="flex items-center gap-2 h-full">
                        {Array.from({ length: numSlides }, (_, i) => {
                            const leftTeam = teams[i * 2];
                            const rightTeam = teams[i * 2 + 1];

                            const leftName = leftTeam?.acronym?.toUpperCase() || "TBD";
                            const rightName = rightTeam?.acronym?.toUpperCase() || "TBD";

                            const label = `${leftName} VS ${rightName}`;

                            const isActive = i === safeSlide;

                            return (
                                <CutOutBtn
                                    key={i}
                                    text={label}
                                    onClick={() => setCurrentSlide(i)}
                                    className={`
                                        rounded-none h-full px-4
                                        ${isActive && "border-cyan-500 bg-cyan-500/15 text-cyan-400"}
                                    `}
                                />
                            );
                        })}
                    </div>

                    <CutOutBtn
                        icon="mdi:chevron-right"
                        onClick={() => setCurrentSlide((p) => Math.min(numSlides - 1, p + 1))}
                        disabled={safeSlide === numSlides - 1}
                        className="h-full w-12 text-xl"
                    />
                </div>
            )}

            {/* The two team slots for the current slide */}
            <div className="flex flex-col xl:flex-row flex-1 h-full gap-8 items-stretch">
                <Team key={`team-${leftIndex}`} index={leftIndex} reverse={false} />

                <span className="
                    m-auto pr-1.5
                    h-24 w-24
                    shrink-0
                    text-center content-center
                    font-bold italic text-2xl
                    border border-slate-700 bg-slate-900
                    rounded-full beveled
                    select-none
                ">
                    VS
                </span>

                <Team key={`team-${rightIndex}`} index={rightIndex} reverse={true} />
            </div>
        </div>
    );
};

const MatchContent = () => {
    const { currentMatch, updateMatch, deleteMatch, updateLoading } = useMatchStore();
    const { teams } = useTeamStore();

    const startMatchModalRef = useRef<ModalRef>(null);
    const resetMatchModalRef = useRef<ModalRef>(null);

    const bansPerTeam = currentMatch?.bans_per_team ?? 3;
    const bestOf = currentMatch?.best_of ?? 3;
    const game = currentMatch?.game;

    const handleUpdateMatch = (field: 'bans_per_team' | 'best_of' | 'game', value: number | string) => {
        if (!currentMatch) return;
        updateMatch({ id: currentMatch.id, [field]: field === 'game' ? value : Number(value) });
    };

    if (!currentMatch) return null;

    return (
        <div className="w-full flex flex-col gap-8">
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
                        disabled={updateLoading || currentMatch.start}
                        value={bestOf}
                        onChange={(value) => {
                            handleUpdateMatch('best_of', value);
                        }}
                        values={[1, 3, 5, 7]}
                    />

                    <MatchEditorField
                        disabled={updateLoading || currentMatch.start}
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
                        disabled={updateLoading || currentMatch.start}
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

            {/* Teams — with slide navigation when there are more than 2 */}
            <TeamSlider />

            <div className="flex flex-col md:flex-row justify-end gap-5 w-full">
                <StartMatchModal ref={startMatchModalRef} />
                <ResetMatchModal ref={resetMatchModalRef} />
                <div className="w-2/3">
                    <CutOutBtnPrimary
                        icon={currentMatch.start ? 'ix:hard-reset' : 'streamline-sharp:startup-solid'}
                        text={currentMatch.start ? 'Reset Match' : 'Start Match'}
                        disabled={updateLoading}
                        alternative={currentMatch.start}
                        onClick={() => {

                            if (currentMatch.start) {
                                resetMatchModalRef.current?.open();
                                return;
                            }

                            if (teams.length < 2) {
                                useAlertStore.getState().addAlert({
                                    message: 'You need 2 teams to start the match',
                                    type: AlertType.WARNING,
                                });
                                return;
                            }

                            startMatchModalRef.current?.open();
                        }}
                    />
                </div>
                <div className="w-1/2">
                    <CutOutBtnPrimary
                        alternative
                        icon="ic:sharp-delete"
                        text="Delete Match"
                        onClick={() => deleteMatch(currentMatch.id)}
                    />
                </div>
            </div>
        </div>
    );
};

export const Match = () => {
    const { currentMatch, loading, subscribeToMatch, closeChannel } = useMatchStore();

    const createMatchModalRef = useRef<ModalRef>(null);
    const joinLobbyModalRef = useRef<ModalRef>(null);

    useEffect(() => {
        if (currentMatch?.id) {
            subscribeToMatch(currentMatch.id);
        }

        return () => closeChannel();
    }, []);

    return (
        <>
            <CreateRoomModal ref={createMatchModalRef} />
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
                            text="Crear Sala"
                            onClick={() => createMatchModalRef.current?.open()}
                        />
                    </div>
                    <div className="flex gap-4 w-full lg:max-w-sm">
                        <CutOutBtn
                            icon="material-symbols:sensor-door"
                            text="Unirse"
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

package services

import (
	"fmt"
	"net/http"
	// "os"
	"path/filepath"

	"jbrodriguez/unbalance/server/src/common"
	"jbrodriguez/unbalance/server/src/domain"
	"jbrodriguez/unbalance/server/src/dto"
	"jbrodriguez/unbalance/server/src/lib"
	"jbrodriguez/unbalance/server/src/net"

	"github.com/gorilla/websocket"
	"github.com/jbrodriguez/actor"
	"github.com/jbrodriguez/mlog"
	"github.com/jbrodriguez/pubsub"
	"github.com/labstack/echo"
	mw "github.com/labstack/echo/middleware"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

const certificate = "/boot/config/ssl/certs/certificate_bundle.pem"

// Server -
type Server struct {
	bus      *pubsub.PubSub
	settings *lib.Settings

	engine *echo.Echo
	actor  *actor.Actor

	ssl string

	pool map[*net.Connection]bool
}

// NewServer -
func NewServer(bus *pubsub.PubSub, settings *lib.Settings, ssl string) *Server {
	server := &Server{
		bus:      bus,
		actor:    actor.NewActor(bus),
		ssl:      ssl,
		settings: settings,
		pool:     make(map[*net.Connection]bool),
	}
	return server
}

// Start -
func (s *Server) Start() {
	mlog.Info("Starting service Server ...")

	locations := []string{
		"/usr/local/emhttp/plugins/unbalance",
		"/usr/local/share/unbalance",
		".",
	}

	location := lib.SearchFile("index.html", locations)
	if location == "" {
		msg := ""
		for _, loc := range locations {
			msg += fmt.Sprintf("%s, ", loc)
		}
		mlog.Fatalf("Unable to find index.html. Exiting now. (searched in %s)", msg)
	}

	mlog.Info("Serving files from %s", location)

	s.engine = echo.New()

	s.engine.HideBanner = true

	s.engine.Use(mw.Logger())
	s.engine.Use(mw.Recover())

	s.engine.Static("/", filepath.Join(location, "index.html"))
	s.engine.Static("/app", filepath.Join(location, "app"))
	s.engine.Static("/img", filepath.Join(location, "img"))
	s.engine.Static("/fonts", filepath.Join(location, "fonts"))

	s.engine.GET("/skt", s.handleWs)

	api := s.engine.Group(common.APIVersion)

	api.GET("/config", s.getConfig)
	api.GET("/state", s.getState)
	api.GET("/storage", s.getStorage)
	api.GET("/operation", s.getOperation)
	api.GET("/history", s.getHistory)

	api.PUT("/config/notifyPlan", s.setNotifyPlan)
	api.PUT("/config/notifyTransfer", s.setNotifyTransfer)
	api.PUT("/config/reservedSpace", s.setReservedSpace)
	api.PUT("/config/verbosity", s.setVerbosity)
	api.PUT("/config/checkUpdate", s.setCheckUpdate)
	api.GET("/update", s.getUpdate)
	api.POST("/tree", s.getTree)
	api.POST("/locate", s.locate)
	api.PUT("/config/dryRun", s.toggleDryRun)
	api.PUT("/config/rsyncArgs", s.setRsyncArgs)

	port := fmt.Sprintf(":%s", s.settings.Port)

	protocol := "http"
	if s.useSsl() {
		protocol = "https"
		go func() {
			err := s.engine.StartTLS(port, certificate, certificate)
			if err != nil {
				mlog.Fatalf("Unable to start on https: %s", err)
			}
		}()
	} else {
		go func() {
			err := s.engine.Start(port)
			if err != nil {
				mlog.Fatalf("Unable to start on http: %s", err)
			}
		}()
	}

	s.actor.Register("socket:broadcast", s.broadcast)
	go s.actor.React()

	mlog.Info("Server started listening %s on %s", protocol, port)
}

// Stop -
func (s *Server) Stop() {
	mlog.Info("stopped service Server ...")
}

func (s *Server) getConfig(c echo.Context) (err error) {
	msg := &pubsub.Message{Reply: make(chan interface{}, common.ChanCapacity)}
	s.bus.Pub(msg, common.APIGetConfig)

	reply := <-msg.Reply
	resp := reply.(*lib.Config)

	return c.JSON(200, &resp)
}

func (s *Server) getState(c echo.Context) (err error) {
	msg := &pubsub.Message{Reply: make(chan interface{}, common.ChanCapacity)}
	s.bus.Pub(msg, common.APIGetState)

	reply := <-msg.Reply
	state := reply.(*domain.State)

	return c.JSON(200, state)
}

func (s *Server) getStorage(c echo.Context) (err error) {
	msg := &pubsub.Message{Reply: make(chan interface{}, common.ChanCapacity)}
	s.bus.Pub(msg, common.APIGetStorage)

	reply := <-msg.Reply
	storage := reply.(*domain.Unraid)

	return c.JSON(200, storage)
}

func (s *Server) getOperation(c echo.Context) (err error) {
	msg := &pubsub.Message{Reply: make(chan interface{}, common.ChanCapacity)}
	s.bus.Pub(msg, common.APIGetOperation)

	reply := <-msg.Reply
	operation := reply.(*domain.Operation)

	return c.JSON(200, operation)
}

func (s *Server) getHistory(c echo.Context) (err error) {
	msg := &pubsub.Message{Reply: make(chan interface{}, common.ChanCapacity)}
	s.bus.Pub(msg, common.APIGetHistory)

	reply := <-msg.Reply
	history := reply.(*domain.History)

	return c.JSON(200, history)
}

func (s *Server) setNotifyPlan(c echo.Context) (err error) {
	var packet dto.Packet

	err = c.Bind(&packet)
	if err != nil {
		mlog.Warning("error binding: %s", err)
	}

	msg := &pubsub.Message{Payload: packet.Payload, Reply: make(chan interface{}, common.ChanCapacity)}
	s.bus.Pub(msg, common.APINotifyPlan)

	reply := <-msg.Reply
	resp := reply.(*lib.Config)

	return c.JSON(200, &resp)
}

func (s *Server) setNotifyTransfer(c echo.Context) (err error) {
	var packet dto.Packet

	err = c.Bind(&packet)
	if err != nil {
		mlog.Warning("error binding: %s", err)
	}

	msg := &pubsub.Message{Payload: packet.Payload, Reply: make(chan interface{}, common.ChanCapacity)}
	s.bus.Pub(msg, common.APINotifyTransfer)

	reply := <-msg.Reply
	resp := reply.(*lib.Config)

	return c.JSON(200, &resp)
}

func (s *Server) setReservedSpace(c echo.Context) (err error) {
	var packet dto.Packet

	err = c.Bind(&packet)
	if err != nil {
		mlog.Warning("error binding: %s", err)
	}

	msg := &pubsub.Message{Payload: packet.Payload, Reply: make(chan interface{}, common.ChanCapacity)}
	s.bus.Pub(msg, common.APISetReserved)

	reply := <-msg.Reply
	resp := reply.(*lib.Config)

	return c.JSON(200, &resp)
}

func (s *Server) setVerbosity(c echo.Context) (err error) {
	var packet dto.Packet

	err = c.Bind(&packet)
	if err != nil {
		mlog.Warning("error binding: %s", err)
	}

	msg := &pubsub.Message{Payload: packet.Payload, Reply: make(chan interface{}, common.ChanCapacity)}
	s.bus.Pub(msg, common.APISetVerbosity)

	reply := <-msg.Reply
	resp := reply.(*lib.Config)

	return c.JSON(200, &resp)
}

func (s *Server) setCheckUpdate(c echo.Context) (err error) {
	var packet dto.Packet

	err = c.Bind(&packet)
	if err != nil {
		mlog.Warning("error binding: %s", err)
	}

	msg := &pubsub.Message{Payload: packet.Payload, Reply: make(chan interface{}, common.ChanCapacity)}
	s.bus.Pub(msg, common.APISetCheckUpdate)

	reply := <-msg.Reply
	resp := reply.(*lib.Config)

	return c.JSON(200, &resp)
}

func (s *Server) getUpdate(c echo.Context) (err error) {
	msg := &pubsub.Message{Reply: make(chan interface{}, common.ChanCapacity)}
	s.bus.Pub(msg, common.APIGetUpdate)

	reply := <-msg.Reply
	resp := reply.(string)

	return c.JSON(200, &resp)
}

func (s *Server) getTree(c echo.Context) (err error) {
	var packet dto.Packet

	err = c.Bind(&packet)
	if err != nil {
		mlog.Warning("error binding: %s", err)
	}

	msg := &pubsub.Message{Payload: packet.Payload, Reply: make(chan interface{}, common.ChanCapacity)}
	s.bus.Pub(msg, common.APIGetTree)

	reply := <-msg.Reply
	resp := reply.(*dto.Entry)

	return c.JSON(200, &resp)
}

func (s *Server) locate(c echo.Context) (err error) {
	var packet dto.Chosen

	err = c.Bind(&packet)
	if err != nil {
		mlog.Warning("error binding packet: %s", err)
	}

	msg := &pubsub.Message{Payload: packet.Payload, Reply: make(chan interface{}, common.ChanCapacity)}
	s.bus.Pub(msg, common.APILocateFolder)

	reply := <-msg.Reply
	resp := reply.(*dto.Location)

	return c.JSON(200, &resp)
}

func (s *Server) toggleDryRun(c echo.Context) (err error) {
	msg := &pubsub.Message{Reply: make(chan interface{}, common.ChanCapacity)}
	s.bus.Pub(msg, common.APIToggleDryRun)

	reply := <-msg.Reply
	resp := reply.(*lib.Config)

	return c.JSON(200, &resp)
}

func (s *Server) setRsyncArgs(c echo.Context) (err error) {
	var packet dto.Packet

	err = c.Bind(&packet)
	if err != nil {
		mlog.Warning("error binding: %s", err)
	}

	msg := &pubsub.Message{Payload: packet.Payload, Reply: make(chan interface{}, common.ChanCapacity)}
	s.bus.Pub(msg, common.APISetRsyncArgs)

	reply := <-msg.Reply
	resp := reply.(*lib.Config)

	return c.JSON(200, &resp)
}

func (s *Server) handleWs(c echo.Context) error {
	ws, err := upgrader.Upgrade(c.Response(), c.Request(), nil)
	if err != nil {
		return err
	}

	conn := net.NewConnection(ws, s.onMessage, s.onClose)
	s.pool[conn] = true

	err = conn.Read()
	return err
}

func (s *Server) onMessage(packet *dto.Packet) {
	s.bus.Pub(&pubsub.Message{Payload: packet.Payload}, packet.Topic)
}

func (s *Server) onClose(c *net.Connection, err error) {
	mlog.Warning("closing socket: %s", err)
	if _, ok := s.pool[c]; ok {
		delete(s.pool, c)
	}
}

func (s *Server) broadcast(msg *pubsub.Message) {
	packet := msg.Payload.(*dto.Packet)
	for conn := range s.pool {
		conn.Write(packet)
	}
}

func (s *Server) useSsl() bool {
	exists, err := lib.Exists(certificate)
	if err != nil {
		mlog.Warning("unable to check for certificate presence:(%s)", err)
	}

	// if usessl == "" this isn't a 6.4.x server
	// otherwise usessl has some value, the plugin will serve off http if the value is no, in any
	// other case, it will serve off https
	return exists && !(s.ssl == "" || s.ssl == "no")
}
